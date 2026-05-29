import { createVerify } from 'crypto';
import http from 'http';
import https from 'https';

let cachePublicKey: string; // 缓存的oss公钥key

/**
 * 校验上传回调
 * @param {Request} req 请求对象
 * @param {string} targetBucket 允许接收回调的bucket名称
 * @return {Promise<boolean>} 校验结果
 */
export const verifyUploadCallback = async (
  req: Request,
  targetBucket: string,
): Promise<boolean> => {
  const bucket = req.headers['x-oss-bucket']; // bucket名称
  if (bucket !== targetBucket) return false;

  try {
    const publickKey = await getPublicKey(req); // oss公钥
    const signature = await getAuthorization(req); // 签名
    const sign_str = await getSignStr(req); // 待签名字符串

    return verifySignature(publickKey, signature, sign_str); // 校验签名
  } catch {
    return false;
  }
};

/**
 * @description: 获取OSS的公钥
 * @param {RouteRequest} req 请求对象
 * @return {Promise<string>} 公钥文本
 */
const getPublicKey = async (req: Request): Promise<string> => {
  const pubKeyUrl = base64ToString(req.headers['x-oss-pub-key-url'] as string);
  let httplib: typeof http | typeof https | undefined;

  if (pubKeyUrl.startsWith('http://gosspublic.alicdn.com/')) {
    httplib = http;
  } else if (pubKeyUrl.startsWith('https://gosspublic.alicdn.com/')) {
    httplib = https;
  }
  if (!httplib) {
    throw new Error('Failed: x-oss-pub-key-url field is not valid.');
  }
  return new Promise((resolve, reject) => {
    if (cachePublicKey) {
      resolve(cachePublicKey);
    } else {
      httplib.get(pubKeyUrl, async (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `Failed: Get OSS public key ${res.statusCode} ${res.statusMessage}`,
            ),
          );
        } else {
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            cachePublicKey = rawData;
            resolve(rawData);
          });
          res.on('error', (err) => {
            reject(err);
          });
        }
      });
    }
  });
};

/**
 * @description: 获取base64解码后OSS的签名header
 * @param {RouteRequest} req 请求对象
 * @return {Buffer} 签名
 */
const getAuthorization = (req: Request): Promise<Buffer> => {
  const authorization = req.headers['authorization'];
  if (!authorization) {
    throw new Error('Failed: authorization field is not valid.');
  }
  return Promise.resolve(Buffer.from(authorization, 'base64'));
};

/**
 * @description: 获取待签名字符串
 * @param {RouteRequest} req 请求对象
 * @return {Promise<string>} 待签名字符串
 */
const getSignStr = async (req: Request): Promise<string> => {
  const fullReqUrl = new URL(req.url, `http://${req.headers['host']}`);
  return (
    decodeURIComponent(fullReqUrl.pathname) +
    fullReqUrl.search +
    '\n' +
    (req as any).rawBody.toString('utf-8')
  );
};

/**
 * @description: 验证签名
 * @param {string} pubKey 公钥
 * @param {Buffer} signature 签名
 * @param {string} byteMD5 待签名字符串
 * @return {boolean} 校验结果
 */
const verifySignature = (
  pubKey: string,
  signature: Buffer,
  byteMD5: string,
): boolean => {
  const verify = createVerify('RSA-MD5');
  verify.update(byteMD5);
  return verify.verify(pubKey, signature);
};

/**
 * @description: base64转字符串
 * @param {string} base64 base64
 * @return {string} 字符串
 */
const base64ToString = (base64: string): string => {
  if (!base64) return '';
  return Buffer.from(base64, 'base64').toString();
};
