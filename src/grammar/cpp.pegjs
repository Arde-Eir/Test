// src/grammar/cpp.pegjs
// FULL C++ BASICS GRAMMAR

start = program

// FIX: Added '?' after the namespace group to make it OPTIONAL
program
  = _ includes:include_directive* _ ("using namespace std;" _)? globals:global_element* _ {
      const main = globals.find(g => g.type === 'MainFunction');
      const functions = globals.filter(g => g.type === 'FunctionDefinition');
      const typedefs = globals.filter(g => g.type === 'Typedef'); 
      return { 
        type: "Program", 
        body: main, 
        functions, 
        typedefs,
        location: location() 
      };
    }

// --- Preprocessor & Global ---
include_directive 
  = "#include" _ "<" chars:[a-zA-Z0-9_.]+ ">" _ { 
      return { type: "Include", value: chars.join(""), location: location() }; 
    }

global_element 
  = main_function 
  / function_definition 
  / typedef_declaration 
  / declaration

// --- Typedef ---
typedef_declaration
  = "typedef" _ oldType:type_specifier _ newName:identifier _ ";" {
      return { type: "Typedef", originalType: oldType, name: newName, location: location() };
    }

// --- Functions ---
main_function 
  = "int main()" _ body:block { 
      return { type: "MainFunction", body, location: location() }; 
    }

function_definition 
  = type:type_specifier _ name:identifier _ "(" _ params:parameter_list? _ ")" _ body:block {
      return { type: "FunctionDefinition", returnType: type, name, params: params || [], body, location: location() };
    }

parameter_list 
  = head:parameter _ tail:("," _ @parameter)* { return [head, ...tail]; }

parameter 
  = type:type_specifier _ name:identifier { 
      return { type: "Parameter", varType: type, name, location: location() }; 
    }

block 
  = "{" _ stmts:statement* _ "}" { 
      return { type: "Block", body: stmts, location: location() }; 
    }

// --- Statements ---
statement
  = typedef_declaration
  / declaration 
  / array_declaration 
  / for_stmt 
  / while_stmt 
  / if_stmt 
  / return_stmt 
  / output_stmt 
  / input_stmt 
  / expr_stmt 
  / block

expr_stmt = expr:expression _ ";" { return expr; }

// --- Control Flow ---
if_stmt 
  = "if" _ "(" _ test:expression _ ")" _ consequent:statement _ alternate:("else" _ @statement)? {
      return { type: "IfStatement", test, consequent, alternate, location: location() };
    }

while_stmt 
  = "while" _ "(" _ test:expression _ ")" _ body:statement {
      return { type: "WhileStatement", test, body, location: location() };
    }

for_stmt 
  = "for" _ "(" _ init:(declaration/expr_stmt/_) _ cond:expression? _ ";" _ step:expression? _ ")" _ body:statement {
      return { type: "ForStatement", init, test: cond, update: step, body, location: location() };
    }

// --- Declarations ---
declaration 
  = type:type_specifier _ name:identifier _ init:("=" _ @expression)? _ ";" {
      return { type: "VariableDeclaration", varType: type, name, value: init, location: location() };
    }

array_declaration 
  = type:type_specifier _ name:identifier _ "[" _ size:number _ "]" _ ";" {
      return { type: "ArrayDeclaration", varType: type, name, size: size.value, location: location() };
    }

// --- I/O ---
output_stmt 
  = "cout" _ "<<" _ val:expression _ chained:("<<" _ @expression)* _ ";" { 
      return { type: "OutputStatement", value: val, location: location() }; 
    }

input_stmt 
  = "cin" _ ">>" _ val:expression _ ";" { 
      return { type: "InputStatement", value: val, location: location() }; 
    }

return_stmt 
  = "return" _ val:expression? _ ";" { 
      return { type: "ReturnStatement", value: val, location: location() }; 
    }

// --- Expressions ---
expression = assignment

assignment 
  = left:identifier_ref _ op:("="/"="/"+="/"-=") _ right:assignment { 
      return { type: "Assignment", operator: op, left, right, location: location() }; 
    } 
  / logical_or

logical_or 
  = left:logical_and _ "||" _ right:logical_or { 
      return { type: "BinaryExpr", operator: "||", left, right, location: location() }; 
    } 
  / logical_and

logical_and 
  = left:equality _ "&&" _ right:logical_and { 
      return { type: "BinaryExpr", operator: "&&", left, right, location: location() }; 
    } 
  / equality

equality 
  = left:relational _ op:("=="/"!=") _ right:equality { 
      return { type: "BinaryExpr", operator: op, left, right, location: location() }; 
    } 
  / relational

relational 
  = left:additive _ op:("<="/">="/"<"/">") _ right:relational { 
      return { type: "BinaryExpr", operator: op, left, right, location: location() }; 
    } 
  / additive

additive 
  = left:multiplicative _ op:("+"/"-") _ right:additive { 
      return { type: "BinaryExpr", operator: op, left, right, location: location() }; 
    } 
  / multiplicative

multiplicative 
  = left:unary _ op:("*"/"/"/"%") _ right:multiplicative { 
      return { type: "BinaryExpr", operator: op, left, right, location: location() }; 
    } 
  / unary

unary 
  = op:("++"/"--") _ arg:identifier_ref { 
      return { type: "UpdateExpr", operator: op, arg, prefix: true, location: location() }; 
    } 
  / primary

primary 
  = number 
  / string_literal 
  / bool_literal 
  / function_call 
  / array_access 
  / identifier_ref 
  / "(" _ expr:expression _ ")" { return expr; }

// --- Function Calls & Access ---
function_call 
  = name:identifier _ "(" _ args:argument_list? _ ")" { 
      return { type: "FunctionCall", name, args: args || [], location: location() }; 
    }

argument_list 
  = head:expression _ tail:("," _ @expression)* { return [head, ...tail]; }

array_access 
  = name:identifier _ "[" _ index:expression _ "]" { 
      return { type: "ArrayAccess", name, index, location: location() }; 
    }

// --- Tokens & Types ---
type_specifier 
  = type_keyword 
  / identifier 

type_keyword = "int" / "float" / "string" / "bool" / "void"

keyword 
  = type_keyword / "if" / "else" / "while" / "for" / "return" / "cin" / "cout" / "using" / "namespace" / "typedef"

identifier 
  = !keyword chars:([a-zA-Z_][a-zA-Z0-9_]*) { return chars.flat().join(""); }

identifier_ref 
  = name:identifier { return { type: "Identifier", name, location: location() }; }

number 
  = digits:[0-9]+ { return { type: "Literal", value: parseInt(digits.join(""), 10), location: location() }; }

string_literal 
  = '"' chars:[^"]* '"' { return { type: "Literal", value: chars.join(""), location: location() }; }

bool_literal 
  = "true" { return { type: "Literal", value: true, location: location() }; }
  / "false" { return { type: "Literal", value: false, location: location() }; }

_ = ([ \t\n\r] / "//" [^\n]*)*