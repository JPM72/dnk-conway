module.exports = {
	presets: [
		[
			'@babel/preset-env',
			{
				modules: false
			}
		],
		["@babel/preset-typescript", { "allowDeclareFields": true }],
		'@babel/preset-react',
	],
	plugins: [
		'@babel/plugin-transform-runtime',
		'@babel/plugin-syntax-dynamic-import',
		["@babel/plugin-proposal-decorators", { "version": "legacy" }],
		'@babel/plugin-transform-class-properties',
		'@babel/plugin-transform-react-inline-elements',
	],
	assumptions: {
		setPublicClassFields: false
	}
}