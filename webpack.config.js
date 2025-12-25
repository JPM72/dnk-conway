const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (_env, argv) =>
{
	const isProduction = argv?.mode === 'production'

	return {
		entry: './src/index.ts',
		output: {
			path: path.resolve(__dirname, 'dist'),
			filename: 'index.js',
			library: {
				name: 'ConwayLib',
				type: 'umd',
				export: 'default',
			},
			globalObject: 'this',
			clean: true,
		},
		devtool: isProduction ? 'source-map' : 'inline-source-map',
		resolve: {
			extensions: ['.ts', '.js'],
		},
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
			]
		},
		devServer: {
			static: {
				directory: path.join(__dirname, 'example'),
			},
			compress: true,
			port: 9000,
			open: true,
		},
		plugins: isProduction ? [] : [
			new HtmlWebpackPlugin({
				template: './example/index.html',
			}),
		],
	}
}
