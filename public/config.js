System.config({
  defaultJSExtensions: true,
  transpiler: "typescript",
  paths: {
    "github:*": "lib/github/*",
    "npm:*": "lib/npm/*"
  },

  packages: {
    "app": {
      "defaultExtension": "ts"
    }
  },

  map: {
    "typescript": "npm:typescript@1.8.0"
  }
});
