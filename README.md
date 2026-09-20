# kds-plugins
---

All type of plugin that will help u to develop the projects and tools , features


## How to register into plugins.json file

```json
{
  "plugins": [
    {
      "name": "greet",
      "type": "file",
      "version": "1.0.0",
      "description": "Demo version of plugin greet"
    }
  ]
}
```



## command register example

```json
[     
    // file type plugin example
    {
      "name": "deploy",
      "description": "Deploy current application to Vercel",
      "run": "src/plugins/deploy/index.js"
    },
    // folder type plugin example
    {
      "name": "auth",
      "description": "Setup authentication module",
      "type": "folder",
      "files": [
        "src/plugins/auth/login.js",
        "src/plugins/auth/register.js"
      ]
    }
]
```
