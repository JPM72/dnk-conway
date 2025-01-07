const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const _ = require('lodash')
const tsconfig = require('./tsconfig.json')

module.exports = (_env, argv) =>
{
	const isProduction = argv?.mode === 'production'

	const resolve = $path => path.resolve(__dirname, $path)
	const paths = tsconfig.compilerOptions.paths
	const trim = s => _.trim(s, './*')

	const alias = _(paths).mapKeys(
		(v, k) => trim(k)
	).mapValues(
		([s]) => resolve(trim(s))
	).value()

	return {
		mode: 'development',
		entry: {
			index: './src/index.tsx',
		},
		output: {
			clean: true,
		},
		devtool: 'inline-source-map',
		resolve: {
			symlinks: false,
			extensions: ['.ts', '.tsx', '.js', '.jsx',],
			alias,
		},
		plugins: [
			new HtmlWebpackPlugin({
				hash: true,
				title: 'Conway\'s Game of Life',
				base: { href: '.' },
				inject: 'body',
				filename: 'index.html',
				template: './public/index.html',
			}),
			new webpack.ProgressPlugin(),
			new webpack.ProvidePlugin({
				_: 'lodash',
				F: 'futil',
			}),
		],
		ignoreWarnings: [
			{
				module: /sass\-loader/
			},
			{
				module: /css\-loader/
			},
		],
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							cacheDirectory: true,
							cacheCompression: false,
							envName: isProduction ? 'production' : 'development'
						}
					}
				},
				{
					test: /\.s?[ac]ss$/i,
					use: [
						'style-loader',
						'css-loader',
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true,
								sassOptions: {
									includePaths: ['src/assets'],
									style: isProduction ? 'compressed' : 'expanded',
								},
							},
						},
					],
				},
				{
					test: /\.svg$/,
					use: ['@svgr/webpack'],
				},
				{
					test: /\.(png|jpg|jpeg|gif)$/i,
					type: 'asset/resource',
				},
				{
					test: /\.(woff|woff2|eot|ttf|otf)$/i,
					type: 'asset/resource',
				},
			]
		},
		devServer: {
			watchFiles: {
				paths: [
					'src/**/*',
				],
				options: {
					ignored: [
						'**/src/server/**/*',
						'**/src/data/**/*'
					]
				}
			},
			historyApiFallback: true,
			client: {
				progress: true,
				reconnect: 3,
			},
			server: {
				type: 'https',
				options: {
					key: fs.readFileSync('C:/xampp/apache/conf/ssl.key/server.key'),
					cert: fs.readFileSync('C:/xampp/apache/conf/ssl.crt/server.crt'),
				},
			},
			open: {
				app: {
					name: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
					arguments: [
						'--allow-insecure-localhost',
					],
				}
			},
		}
	}
}