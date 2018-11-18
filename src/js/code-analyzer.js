import * as esprima from 'esprima';
let parsedForTable = [['Line', 'Type', 'Name', 'Condition', 'Value']];
let line = 1;
let isElse = false;

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};
export {parseCode};
export {line};
export {parsedForTable};


const parseCodeForTable = (parsedCode) => {
    parsedForTable = [['Line', 'Type', 'Name', 'Condition', 'Value']];
    convertParsedCodeToLocal(parsedCode);
    line = 1;
    return parsedForTable;
};

const clearTable = () => {
    parsedForTable = [['Line', 'Type', 'Name', 'Condition', 'Value']];
    line = 1;
};

let funcDeclaration = function funcDeclaration(parsedCode) {
    parsedForTable[parsedForTable.length] = [line, 'Function Declaration', parsedCode.id.name,' ' ,' ' ];
    for(let i=0 ; i<parsedCode.params.length; i++) {
        parsedForTable[parsedForTable.length] = [line, 'Variable Declaration', parsedCode.params[i].name, ' ', ' '];
    }
    line++;
    convertParsedCodeToLocal(parsedCode.body);
};

let blockStatement = function blockStatement(parsedCode) {
    for(let i=0; i<parsedCode.length; i++) {
        mapper[parsedCode[i].type].call(undefined, parsedCode[i]);
    }
};


let initMapper = {'FunctionDeclaration': funcDeclaration, 'BlockStatement': blockStatement, 'Program': blockStatement};

function convertParsedCodeToLocal(parsedCode) {
    if (parsedCode.body != undefined && parsedCode.body[0] != undefined) {
        if(parsedCode.body[0].type === 'FunctionDeclaration') {
            funcDeclaration(parsedCode.body[0]);
        } else {
            initMapper[parsedCode.type].call(undefined, parsedCode.body);
        }
    }
}

function varDeclaration(parsedCode) {
    for(let i = 0; i<parsedCode.declarations.length; i++) {
        let val = ' ';
        if(parsedCode.declarations[i].init != null) {
            if(parsedCode.declarations[i].init.type === 'Literal') {
                val = parsedCode.declarations[i].init.value;
            } else if (parsedCode.declarations[i].init.type === 'Identifier') {
                val = parsedCode.declarations[i].init.name;
            }
            else {
                val = binaryExpression(parsedCode.declarations[i].init);
            }
        }
        parsedForTable[parsedForTable.length] = [line, parsedCode.type, parsedCode.declarations[i].id.name, ' ',  val];
    }
    line++;
}

let expressionStatement = function expressionStatement(parsedCode) {
    if(parsedCode.expression.right.type === 'Literal') {
        parsedForTable[parsedForTable.length] = [line, parsedCode.expression.type, parsedCode.expression.left.name, ' ',  parsedCode.expression.right.value];
    }
    else  {
        let right = mapper[parsedCode.expression.right.type].call(undefined, parsedCode.expression.right);
        parsedForTable[parsedForTable.length] = [line, parsedCode.expression.type, parsedCode.expression.left.name, ' ',  right];
    }
    line++;
};

let binaryExpression = function binaryExpression(parsedCode){
    let exp = '';
    exp += left(parsedCode);
    exp += ' ' + parsedCode.operator + ' ';
    exp += right(parsedCode);
    return exp;
};

let left = function left(parsedCode) {
    let exp = '';
    if (parsedCode.left.type === 'Identifier') {
        exp = parsedCode.left.name;
    } else if ( parsedCode.left.type === 'Literal') {
        exp += parsedCode.left.value;
    } else {
        exp += mapper[parsedCode.left.type].call(undefined, parsedCode.left);
    }
    return exp;
};

let right = function right(parsedCode) {
    let exp = '';
    if (parsedCode.right.type === 'Identifier') {
        exp += parsedCode.right.name;
    } else if ( parsedCode.right.type === 'Literal') {
        exp += parsedCode.right.value;
    }
    else {
        exp += mapper[parsedCode.right.type].call(undefined, parsedCode.right);
    }
    return exp;
};

let memberExpression = function memberExpression(parsedCode) {
    let exp = parsedCode.object.name + '[';
    if (parsedCode.property.type === 'Identifier') {
        exp += parsedCode.property.name;
    } else if (parsedCode.property.type === 'Literal') {
        exp += parsedCode.property.value;
    }
    return exp + ']';
};

let whileAndIfStatement = function whileAndIfStatement(parsedCode) {
    let test;
    if(parsedCode.test.type === 'BinaryExpression' || 'LogicalExpression') {
        test = binaryExpression(parsedCode.test);
    }
    let type = parsedCode.type;
    if (isElse) {
        type = 'Else ' + type;
    }
    parsedForTable[parsedForTable.length] = [line, type, ' ', test, ' '];
    line++;
    whileIfMapper[parsedCode.type].call(undefined, parsedCode);
    isElse = false;
};

let whileStatement = function whileStatement(parsedCode) {
    if(parsedCode.body.body != undefined) {
        blockStatement(parsedCode.body.body);
    } else {
        blockStatement([parsedCode.body]);
    }
};

let ifStatement = function ifStatement(parsedCode) {
    if(parsedCode.consequent.type === 'BlockStatement') {
        blockStatement(parsedCode.consequent.body);
    } else {
        blockStatement([parsedCode.consequent]);
    }
    if (parsedCode.alternate != undefined) {
        isElse = true;
        blockStatement([parsedCode.alternate]);
    }
};


let returnStatement = function returnStatement(parsedCode) {
    let val = '';
    if (parsedCode.argument.type === 'Identifier') {
        val = parsedCode.argument.name;
    } else if (parsedCode.argument.type === 'Literal') {
        val = parsedCode.argument.value;
    } else  {
        val = mapper[parsedCode.argument.type].call(undefined, parsedCode.argument);
    }
    parsedForTable[parsedForTable.length] = [line, parsedCode.type, ' ', ' ', val];
    line++;
};

let unaryExpression = function unaryExpression(parsedCode) {
    let val = parsedCode.operator;
    if (parsedCode.argument.type === 'Literal') {
        val += parsedCode.argument.value;
    } else if ( parsedCode.argument.type === 'Identifier') {
        val += parsedCode.argument.name;
    }
    return val;
};

let identifier = function(parsedCode) {
    return parsedCode.name;
};

let initFor = function initFor(init) {
    let val = '';
    if(init.type === 'VariableDeclaration') {
        val = init.declarations[0].id.name + ' =';
        if(init.declarations[0].init.type === 'Literal') {
            val += ' ' + init.declarations[0].init.value;
        } else if (init.declarations[0].init.type === 'Identifier') {
            val += ' ' +  init.declarations[0].init.name;
        }
        else {
            val += ' ' +  binaryExpression(init.declarations[0].init);
        }
    } else {
        val = binaryExpression(init);
    }
    return val;
};

let forStatement = function forStatement(parsedCode) {
    let init = initFor(parsedCode.init);
    let test = binaryExpression(parsedCode.test);
    let update = binaryExpression(parsedCode.update);
    parsedForTable[parsedForTable.length] = [line, parsedCode.type, ' ', init + '; ' + test + '; ' + update, ' '];
    line++;
    if(parsedCode.body.body.length > 0) {
        blockStatement(parsedCode.body.body);
    }
};


let mapper = {'BinaryExpression': binaryExpression,'UnaryExpression': unaryExpression, 'MemberExpression': memberExpression,
    'ExpressionStatement': expressionStatement, 'WhileStatement': whileAndIfStatement, 'IfStatement': whileAndIfStatement,
    'ReturnStatement': returnStatement, 'VariableDeclaration': varDeclaration, 'Identifier': identifier, 'BlockStatement': blockStatement,
    'ForStatement': forStatement};

let whileIfMapper = {'WhileStatement': whileStatement, 'IfStatement': ifStatement};

export {convertParsedCodeToLocal};
export {parseCodeForTable};
export {clearTable};
