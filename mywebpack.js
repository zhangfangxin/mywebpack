/**
 * 1 通过AST  分析内容依赖 babylon 转成AST
 * 2 babel-traverse 可以用这个遍历语法树
 *
 */

const fs = require("fs");
const babylone = require("babylon");
const traverse = require("babel-traverse").default;
const path = require("path");
const babel = require("babel-core");
let ID = 0;

//获取入口文件 找到依赖生成 node树
function createAsset(fileName) {
  const content = fs.readFileSync(fileName, "utf-8");
  const ast = babylone.parse(content, { sourceType: "module" });

  //储存依赖路径
  const dependenceies = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependenceies.push(node.source.value);
    },
  });
  const id = ID++;
  //拿到内容
  const { code } = babel.transformFromAst(ast, null, { presets: ["env"] });

  return {
    id,
    fileName,
    dependenceies,
    code,
  };
}

/**
 * 
 * mainAsset ：{
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
 */
function createGraph(entry) {
  const mainAsset = createAsset(entry);
  const allAsset = [mainAsset];
  for (let asset of allAsset) {
    const dirname = path.dirname(asset.fileName);
    asset.mapping = {};
    asset.dependenceies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);
      const childAsset = createAsset(absolutePath);
      asset.mapping[relativePath] = childAsset.id;
      allAsset.push(childAsset);
    });
  }
  return allAsset;
}

/**
 * [
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
 */
const graph = createGraph("./source/index.js");
function boundle(graph) {
  let modules = "";
  graph.forEach((module) => {
    modules += `${module.id}:[function(require,module,exports){
        ${module.code}
    }, ${JSON.stringify(module.mapping)}],`;
  });
  const result = `(function (modules){
    function require(id){
        const [fn, mapping] = modules[id]
        function localRequire(relativePath){
            return require(mapping[relativePath])
        }
        const module = {exports:{}}
        fn(localRequire, module, module.exports)
        return module.exports
    }
    require(0)
  })({${modules}})`;

  return result;
}

