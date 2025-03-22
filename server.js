const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// 提供静态文件服务
app.use(express.static('./'));

// 创建assets文件夹的端点
app.post('/create-assets', (req, res) => {
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir);
        console.log('创建assets文件夹成功');
    }
    res.send('OK');
});

app.listen(port, () => {
    console.log(`游戏服务器运行在 http://localhost:${port}`);
}); 