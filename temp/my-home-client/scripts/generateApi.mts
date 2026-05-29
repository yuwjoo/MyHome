import fs from "node:fs";
import openapiTS, { astToString } from "openapi-typescript";
import prettier from "prettier";
import { IndexedAccessTypeNode, Project, ScriptKind, SourceFile, SyntaxKind, TypeLiteralNode } from "ts-morph";

const apiDocJsonUrl = "http://localhost:3000/api/docs-json"; // api文档json数据地址
const perttierConfig = await prettier.resolveConfig("./.prettierrc.js"); // perttier配置文件
const project = new Project();
const apiTypeFilePath = "./src/api/base/api.d.ts"; // api类型文件路径
const apiServerFilePath = "./src/api/base/index.ts"; // api函数文件路径

async function main() {
  const apiTypeCode = await generateApiTypeFile();
  await generateApiFunFile(apiTypeCode);
}

main();

/**
 * 保存代码文件
 * @param code 代码文本
 * @param filePath 保存的文件路径
 */
async function saveCodeFile(code: string, filePath: string) {
  // 使用perttier格式化代码
  const formattedContents = prettier.format(code, {
    ...perttierConfig,
    parser: "typescript"
  });

  fs.writeFileSync(filePath, formattedContents);
}

/**
 * 生成api类型文件
 * @return {string} api类型文件代码
 */
async function generateApiTypeFile(): Promise<string> {
  const ast = await openapiTS(new URL(apiDocJsonUrl));
  const contents = astToString(ast);

  saveCodeFile(contents, apiTypeFilePath);

  return contents;
}

/**
 * 解析api类型文件
 * @param apiTypeCode api类型文件代码
 * @return 解析数据
 */
async function parseApiTypeFile(apiTypeCode: string) {
  const sourceFile = project.createSourceFile("virtual.d.ts", apiTypeCode, {
    overwrite: true,
    scriptKind: ScriptKind.TS
  });
  const methodArr = ["get", "post", "put", "delete"];

  // 获取method信息
  const getMethodInfo = (typeNode: TypeLiteralNode) => {
    let methodName: string;
    let methodTypeNode: IndexedAccessTypeNode;
    let comment: string;
    typeNode.getProperties().forEach((prop) => {
      const name = prop.getName();
      const type = prop.getType();
      if (methodArr.includes(name) && !type.isNever()) {
        methodName = name;
        methodTypeNode = prop.getTypeNodeOrThrow().asKindOrThrow(SyntaxKind.IndexedAccessType);
        comment = prop.getJsDocs()[0].getCommentText() || "";
      }
    });
    return { methodName: methodName!, methodTypeNode: methodTypeNode!, methodComment: comment! };
  };

  // 获取operations信息
  const getOperationsInfo = (typeNode: IndexedAccessTypeNode) => {
    const pTypeNode = typeNode.getType().getSymbolOrThrow().getDeclarations()[0].asKindOrThrow(SyntaxKind.TypeLiteral);

    const parametersTypNode = pTypeNode
      .getPropertyOrThrow("parameters")
      .getTypeNodeOrThrow()
      .asKindOrThrow(SyntaxKind.TypeLiteral);
    const hasQuery = !parametersTypNode.getPropertyOrThrow("query").getType().isNever();

    const requestBodyTypeNode = pTypeNode.getPropertyOrThrow("requestBody").getTypeNodeOrThrow();
    const hasData = !requestBodyTypeNode.getType().isNever();

    return { hasQuery, hasData };
  };

  // 获取paths接口
  const pathsInterface = sourceFile.getInterfaceOrThrow("paths")!;

  // 获取api信息
  const apiInfos = pathsInterface.getProperties().map((prop) => {
    const apiPath = prop.getSymbolOrThrow().getName();
    const apiTypeNode = prop.getTypeNodeOrThrow().asKindOrThrow(SyntaxKind.TypeLiteral);
    const methodInfo = getMethodInfo(apiTypeNode);
    const operationsInfo = getOperationsInfo(methodInfo.methodTypeNode);

    return {
      url: apiPath.replace("/api", ""),
      method: methodInfo.methodName,
      comment: methodInfo.methodComment,
      hasQuery: operationsInfo.hasQuery,
      hasData: operationsInfo.hasData
    };
  });

  return apiInfos;
}

/**
 * 生成api函数文件
 * @param apiTypeCode api类型文件代码
 */
async function generateApiFunFile(apiTypeCode: string) {
  const apiFile = project.createSourceFile("serverApi.ts", "", {
    overwrite: true,
    scriptKind: ScriptKind.TS
  });

  // 生成顶部导入
  apiFile.addImportDeclaration({
    isTypeOnly: true,
    namedImports: ["ServerApi"],
    moduleSpecifier: "@/api/base/types"
  });
  apiFile.addImportDeclaration({
    isTypeOnly: true,
    namedImports: ["ResponseBody"],
    moduleSpecifier: "@/api/types"
  });
  apiFile.addImportDeclaration({
    namedImports: ["request"],
    moduleSpecifier: "@/utils/axios"
  });

  // 解析api类型文件
  const apiInfos = await parseApiTypeFile(apiTypeCode);
  apiInfos.forEach((info) => {
    generateApiFunction(apiFile, info.comment, info.url, info.method, info.hasQuery, info.hasData);
  });

  saveCodeFile(apiFile.getFullText(), apiServerFilePath);
}

/**
 * 生成api请求函数
 * @param comment 函数注释
 * @param url 请求路径
 * @param method 请求方法
 * @param hasQuery 是否需要传query
 * @param hasData 是否需要传data
 */
export function generateApiFunction(
  sourceFile: SourceFile,
  comment: string,
  url: string,
  method: string,
  hasQuery: boolean,
  hasData: boolean
) {
  // 生成函数名称
  const funcName = url
    .split("/")
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
  // 生成请求方法
  const upperMethod = method.toUpperCase();
  // 生成入参字段
  const parameters: { name: string; type: string }[] = [];
  if (hasQuery) {
    parameters.push({
      name: "params",
      type: `ServerApi["${url}"]["config"]["params"]`
    });
  }
  if (hasData) {
    parameters.push({
      name: "data",
      type: `ServerApi["${url}"]["config"]["data"]`
    });
  }
  // 生成函数返回值类型
  const returnType = `ResponseBody<ServerApi["${url}"]["response"]>`;

  // 生成请求函数
  sourceFile.addFunction({
    docs: [{ description: `\n${comment}` }], // JSDoc 注释
    isExported: true, // 是否导出
    name: funcName, // 函数名
    parameters, // 函数参数
    statements: (writer) => {
      // 生成 config 变量
      writer.write(`const config: ServerApi["${url}"]["config"] = `).block(() => {
        writer.writeLine(`url: "${url}",`);
        writer.writeLine(`method: "${upperMethod}",`);
        parameters.forEach((p) => {
          writer.writeLine(p.name);
        });
      });

      // 生成 return 语句
      writer.write(`return request<${returnType}>(config);`);
    } // 函数体
  });
}
