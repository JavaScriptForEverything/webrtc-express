module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es2021": true,
        "node": true,
				"io": true
    },
    "extends": "eslint:recommended",
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "rules": {
			"no-constant-condition" : "warn",
			"no-unused-vars" : [
				"warn",{
					"argsIgnorePattern": "^_",
					"varsIgnorePattern": "^_"
				}
			]

    }
}
