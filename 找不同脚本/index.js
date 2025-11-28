// 配置参数
const config = {
    columns: 4,        // 列数
    rows: 10,         // 行数
    tolerance: 10,    // 图片对比的容差值（0-255）
    outputPath: 'output' // 输出目录
};

// 保存视频帧
function saveFrame() {
    const video = document.getElementById('videoElement');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
}

// 将图片分割成小块
function splitImage(canvas) {
    const pieces = [];
    const pieceWidth = canvas.width / config.columns;
    const pieceHeight = canvas.height / config.rows;
    
    for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.columns; col++) {
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = pieceWidth;
            pieceCanvas.height = pieceHeight;
            const pieceCtx = pieceCanvas.getContext('2d');
            
            pieceCtx.drawImage(
                canvas,
                col * pieceWidth, row * pieceHeight,
                pieceWidth, pieceHeight,
                0, 0,
                pieceWidth, pieceHeight
            );
            
            pieces.push(pieceCanvas);

            window.addEventListener("keydown")
            // pieceCanvas.style.cssText = `position: fixed; z-index: 9999; top: ${row * pieceHeight}px; left: ${col * pieceWidth}px`
            // document.body.appendChild(pieceCanvas)
        }
    }

    return pieces;
}

// 比较两个图片的相似度
function comparePieces(piece1, piece2) {
    const ctx1 = piece1.getContext('2d');
    const ctx2 = piece2.getContext('2d');
    const data1 = ctx1.getImageData(0, 0, piece1.width, piece1.height).data;
    const data2 = ctx2.getImageData(0, 0, piece2.width, piece2.height).data;
    
    let differences = 0;
    
    for (let i = 0; i < data1.length; i += 4) {
        const diffR = Math.abs(data1[i] - data2[i]);
        const diffG = Math.abs(data1[i + 1] - data2[i + 1]);
        const diffB = Math.abs(data1[i + 2] - data2[i + 2]);
        
        if (diffR > config.tolerance || diffG > config.tolerance || diffB > config.tolerance) {
            differences++;
        }
    }
    
    return differences / (data1.length / 4); // 返回差异像素的比例
}

// 找出不同的图片
function findDifferentPiece(pieces) {
    const diffThreshold = 0.1; // 差异阈值
    
    for (let i = 0; i < pieces.length; i++) {
        let isDifferent = true;
        let similarCount = 0;
        
        for (let j = 0; j < pieces.length; j++) {
            if (i === j) continue;
            
            const difference = comparePieces(pieces[i], pieces[j]);
            if (difference < diffThreshold) {
                similarCount++;
            }
        }
        
        // 如果一个piece与其他pieces的相似度都很低，则认为它是不同的
        if (similarCount < pieces.length / 2) {
            return i;
        }
    }
    
    return -1; // 没有找到明显不同的图片
}

// 主函数
function findDifference() {
    const canvas = saveFrame();
    const pieces = splitImage(canvas);
    const differentIndex = findDifferentPiece(pieces);
    
    // 显示结果
    const resultDiv = document.createElement('div');
    resultDiv.style.position = 'fixed';
    resultDiv.style.top = '10px';
    resultDiv.style.left = '10px';
    resultDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    resultDiv.style.color = 'white';
    resultDiv.style.padding = '10px';
    resultDiv.style.borderRadius = '5px';
    resultDiv.style.zIndex = 9999;
    
    if (differentIndex !== -1) {
        const row = Math.floor(differentIndex / config.columns);
        const col = differentIndex % config.columns;
        resultDiv.textContent = `找到不同图片！位置：第${row + 1}行，第${col + 1}列`;
    } else {
        resultDiv.textContent = '未找到明显不同的图片';
    }
    
    document.body.appendChild(resultDiv);
    
    // 可选：保存分割后的图片
    pieces.forEach((piece, index) => {
        const link = document.createElement('a');
        link.href = piece.toDataURL('image/png');
        link.download = `piece_${index}.png`;
        // link.click(); // 取消注释此行以保存所有分割的图片
    });
}

// 启动函数
findDifference();