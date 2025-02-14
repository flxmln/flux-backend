require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// ✅ `/generate` のルートを正しく設定
app.get("/generate", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "プロンプトを入力してください。" });
    }

    try {
        const response = await axios.post(
            "https://api.replicate.com/v1/predictions",
            {
                version: "latest",
                input: { prompt: prompt }
            },
            {
                headers: {
                    Authorization: `Token ${REPLICATE_API_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const prediction = response.data;
        let imageUrl = null;
        while (!imageUrl) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            const statusResponse = await axios.get(
                `https://api.replicate.com/v1/predictions/${prediction.id}`,
                {
                    headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` }
                }
            );

            if (statusResponse.data.status === "succeeded") {
                imageUrl = statusResponse.data.output[0];
            } else if (statusResponse.data.status === "failed") {
                return res.status(500).json({ error: "画像生成に失敗しました。" });
            }
        }

        res.json({ image_url: imageUrl });

    } catch (error) {
        console.error("エラー:", error);
        res.status(500).json({ error: "API リクエストに失敗しました。" });
    }
});

// ✅ サーバーが正しく起動しているか確認用
app.get("/", (req, res) => {
    res.send("Server is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
