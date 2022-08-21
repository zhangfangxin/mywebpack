## webpack 打包原理

# 1 通过 AST 分析内容依赖 可以通过 babylon 将文件转成 AST

    ```

    const ast = babylone.parse(content, { sourceType: "module" })

    ```

# 2.通过 babel-traverse babel-core 将 ast 转为可以遍历的类似对象的类型 就可以拿到文件对应的依赖 将依赖放入到 dependenceies 中

```
 traverse(ast, {
   ImportDeclaration: ({ node }) => {
     dependenceies.push(node.source.value);
   },
 });
```

# 3.通过 babel 拿到文件内容最后返回一个对象

```
const { code } = babel.transformFromAst(ast, null, { presets: ["env"] });

{
id: 0,
fileName: './source/index.js',
dependenceies: [ './message.js' ],
code: '"use strict";\n' +
  '\n' +
  'var _message = require("./message.js");\n' +
  '\n' +
  'var _message2 = _interopRequireDefault(_message);\n' +
  '\n' +
  'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n' +
  '\n' +
  'console.log(_message2.default);'
}
``

```
# 3.通过createGraph 遍历 将文件相对路径改为绝对路径 并生成文件路径和id的对应 
```
 asset.dependenceies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const childAsset = createAsset(absolutePath);
      asset.mapping[relativePath] = childAsset.id;
      allAsset.push(childAsset);
    });
```
[
  {
    id: 0,
    fileName: './source/index.js',
    dependenceies: [ './message.js' ],
    code: '"use strict";\n' +
      '\n' +
      'var _message = require("./message.js");\n' +
      '\n' +
      'var _message2 = _interopRequireDefault(_message);\n' +
      '\n' +
      'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n' +
      '\n' +
      'console.log(_message2.default);',
    mapping: { './message.js': 1 }
  },
  {
    id: 1,
    fileName: 'source/message.js',
    dependenceies: [ './name.js' ],
    code: '"use strict";\n' +
      '\n' +
      'Object.defineProperty(exports, "__esModule", {\n' +
      '  value: true\n' +
      '});\n' +
      '\n' +
      'var _name = require("./name.js");\n' +
      '\n' +
      'var _name2 = _interopRequireDefault(_name);\n' +
      '\n' +
      'function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }\n' +
      '\n' +
      '(0, _name2.default)();\n' +
      "exports.default = 'addd';",
    mapping: { './name.js': 2 }
  },
  {
    id: 2,
    fileName: 'source/name.js',
    dependenceies: [],
    code: '"use strict";\n' +
      '\n' +
      'Object.defineProperty(exports, "__esModule", {\n' +
      '  value: true\n' +
      '});\n' +
      '\n' +
      'exports.default = function () {\n' +
      "  console.log('aß');\n" +
      '};',
    mapping: {}
  }
]
# 4.通过boundle 进行最终的打包 通过在线babel 我们看到我们的函数需要有一个 require exports 方法 最终真正导出的其实是 module.exports对象