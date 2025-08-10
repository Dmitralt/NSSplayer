const path = require("path");

module.exports = {
    mode: "production",
    entry: "./src/web-ui/index.jsx",
    output: {
        path: path.resolve(__dirname, "public", "web-ui"),
        filename: "bundle.js",
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-react"],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: [".js", ".jsx"],
    },
};
