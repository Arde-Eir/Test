import * as peg from 'pegjs';
import { ASTNode } from '../types';

const grammarSource = `
{
  let nodeIdCounter = 0;
  function nextId() { return "n" + (nodeIdCounter++); }
}

// --- 1. ENTRY POINT ---
Start
  = _ headers:Preprocessor* _ ns:NamespaceDirective? _ funcsBefore:FunctionDefinition* _ main:MainFunction _ funcsAfter:FunctionDefinition* {
      const programBody = [];
      if (ns) programBody.push(ns);
      funcsBefore.forEach(f => programBody.push(f));
      programBody.push({
        id: nextId(), 
        type: "Main", 
        body: main.body, 
        line: main.line
      });
      funcsAfter.forEach(f => programBody.push(f));
      return [{
        id: nextId(), type: "Program", body: programBody, line: location().start.line
      }];
  }

MainFunction
  = "int" _ "main" _ "(" _ ")" _ "{" _ body:BlockContent _ "}" {
      return { type: "Main", body: body, line: location().start.line };
  }

// --- 2. STRUCTURES ---
Preprocessor
  = "#include" _ "<" [a-zA-Z0-9_.]+ ">" _

NamespaceDirective
  = "using" _ "namespace" _ "std" _ ";" {
      return { id: nextId(), type: "NamespaceDirective", name: "std", line: location().start.line };
  }

FunctionDefinition
  = type:Type _ name:Identifier 
    &{ return name !== "main"; } 
    _ "(" _ params:ParameterList? _ ")" _ "{" _ body:BlockContent _ "}" _ {
      return {
        id: nextId(),
        type: "FunctionDefinition",
        returnType: type,
        name: name,
        params: params || [],
        body: body,
        line: location().start.line
      };
  }

ParameterList
  = head:Parameter tail:(_ "," _ Parameter)* {
      return [head, ...tail.map(t => t[3])];
  }

Parameter
  = type:Type _ name:Identifier {
      return { type: "Parameter", dataType: type, name: name };
  }

BlockContent
  = statements:Statement* { return statements; }

// --- 3. STATEMENTS ---
Statement
  = _ s:(
      TypedefDeclaration
      / Declaration
      / Assignment
      / WhileLoop
      / ForLoop
      / SwitchStatement
      / UpdateStatement
      / FunctionCallStatement
      / IfStatement
      / CoutStatement
      / CinStatement
      / ReturnStatement
      / BreakStatement    
      / ContinueStatement 
    ) { return s; }

TypedefDeclaration
  = "typedef" _ baseType:Type _ newName:Identifier _ ";" {
      return {
        id: nextId(),
        type: "TypedefDeclaration",
        baseType: baseType,
        newName: newName,
        line: location().start.line
      };
  }

Declaration
  = mod:("const" _)? type:Type _ name:Identifier _ dims:ArrayDimensions? _ init:("=" _ (ArrayInitializer / ExpressionWithText))? _ ";" {
      const isArray = !!dims;
      const is2D = dims && dims.length === 2;
      const initData = init ? init[2] : null;
      
      return {
        id: nextId(),
        type: "VariableDeclaration",
        dataType: is2D ? type + "[][]" : (isArray ? type + "[]" : type),
        name: name,
        isConst: !!mod, 
        isArray: isArray,
        is2D: is2D,
        arraySize: isArray ? dims : undefined,
        value: initData ? (initData.text || JSON.stringify(initData)) : (isArray ? "[Array]" : "undefined"),
        valueNode: initData ? (initData.node || initData) : null,
        line: location().start.line
      };
  }

ArrayDimensions
  = "[" _ size1:[0-9]+ _ "]" _ "[" _ size2:[0-9]+ _ "]" {
      return [parseInt(size1.join("")), parseInt(size2.join(""))];
  }
  / "[" _ size:[0-9]+ _ "]" {
      return [parseInt(size.join(""))];
  }

ArrayInitializer
  = "{" _ values:InitializerList _ "}" { 
      return { type: "ArrayInitializer", values: values }; 
  }

InitializerList
  = head:(ArrayInitializer / Expression) tail:(_ "," _ (ArrayInitializer / Expression))* {
      return [head, ...tail.map(t => t[3])];
  }

Assignment
  = name:Identifier _ index:ArrayIndex? _ op:AssignmentOp _ val:ExpressionWithText _ ";" {
      const finalName = index ? name + "[" + index.flatStr + "]" : name;
      return {
        id: nextId(),
        type: "Assignment",
        name: finalName,
        targetName: name,           // NEW: Store base array name
        indexNode: index ? index.node : null,  // NEW: Store index AST
        operator: op,
        value: val.text,
        valueNode: val.node,
        line: location().start.line
      };
  }

AssignmentOp = "=" / "+=" / "-=" / "*=" / "/="

WhileLoop
  = "while" _ "(" _ cond:ExpressionString _ ")" _ "{" _ body:BlockContent _ "}" {
      return { 
      id: nextId(),
       type: "WhileLoop", 
       condition: cond, 
       conditionNode: null, 
       body: body, 
       line: location().start.line };
  }

ForLoop
  = "for" _ "(" _ init:ForInit _ cond:ExpressionString _ ";" _ step:ExpressionString _ ")" _ "{" _ body:BlockContent _ "}" {
      return {
        id: nextId(), 
        type: "ForLoop", 
        condition: cond + " (Step: " + step + ")",
        body: body,
        line: location().start.line
      };
  }

SwitchStatement
  = "switch" _ "(" _ expr:ExpressionString _ ")" _ "{" _ cases:SwitchCase* _ defaultCase:DefaultCase? _ "}" {
      return {
        id: nextId(),
        type: "SwitchStatement",
        discriminant: expr,
        cases: cases,
        defaultCase: defaultCase,
        line: location().start.line
      };
  }

SwitchCase
  = "case" _ value:Expression _ ":" _ body:CaseBody {
      return {
        id: nextId(),
        type: "SwitchCase",
        value: value,
        body: body,
        line: location().start.line
      };
  }

DefaultCase
  = "default" _ ":" _ body:CaseBody {
      return {
        id: nextId(),
        type: "DefaultCase",
        body: body,
        line: location().start.line
      };
  }

CaseBody
  = statements:CaseStatement* { return statements; }

CaseStatement
  = _ s:(
      Declaration
      / Assignment
      / CoutStatement
      / CinStatement
      / BreakStatement
      / ContinueStatement
      / ReturnStatement
      / UpdateStatement
    ) { return s; }

BreakStatement
  = "break" _ ";" { return { id: nextId(), type: "BreakStatement", line: location().start.line }; }

ContinueStatement
  = "continue" _ ";" { return { id: nextId(), type: "ContinueStatement", line: location().start.line }; }

IfStatement
  = "if" _ "(" _ cond:ExpressionString _ ")" _ "{" _ body:BlockContent _ "}" 
    _ elseIfs:ElseIfClause* 
    _ elseClause:("else" _ "{" _ BlockContent _ "}")? {
      return { 
        id: nextId(), 
        type: "IfStatement", 
        condition: cond, 
        body: body,
        elseIfs: elseIfs,
        alternate: elseClause ? elseClause[4] : null,
        line: location().start.line 
      };
  }

ElseIfClause
  = "else" _ "if" _ "(" _ cond:ExpressionString _ ")" _ "{" _ body:BlockContent _ "}" {
      return {
        id: nextId(),
        type: "ElseIfClause",
        condition: cond,
        body: body,
        line: location().start.line
      };
  }

CoutStatement
  = "cout" _ "<<" _ val:CoutValue _ ";" {
      return {
        id: nextId(), 
        type: "CoutStatement", 
        value: val, 
        line: location().start.line
      };
  }

CoutValue 
  = head:CoutItem rest:(_ "<<" _ CoutItem)* { 
      return text();
  }

CoutItem = "endl" / Expression

CinStatement
  = "cin" _ ">>" _ vars:CinList _ ";" {
      return { 
      id: nextId(), 
      type: "CinStatement", 
      value: vars,  
      line: location().start.line };
  }

CinList
  = head:Identifier tail:(_ ">>" _ Identifier)* {
      return [head, ...tail.map(t => t[3])];
  }

ReturnStatement
  = "return" _ val:Expression? _ ";" {
      return {
        id: nextId(), 
        type: "ReturnStatement", 
        argument: val, 
        line: location().start.line
      };
  }

FunctionCallStatement
  = call:FunctionCall _ ";" { 
      return { 
          id: nextId(), 
          type: "ExpressionStatement", 
          expression: call,
          line: location().start.line 
      }; 
  }

FunctionCall
  = name:Identifier _ "(" _ args:ArgumentList? _ ")" {
      return {
        id: nextId(),
        type: "CallExpression",
        callee: name,
        arguments: args || [],
        line: location().start.line
      };
  }

ArgumentList
  = head:Expression tail:(_ "," _ Expression)* {
      return [head, ...tail.map(t => t[3])];
  }

// --- 4. EXPRESSIONS ---
ExpressionWithText = e:Expression { return { node: e, text: text() }; }
ExpressionString   = e:Expression { return text(); }

Expression = LogicOr

LogicOr   
  = head:LogicAnd tail:(_ "||" _ LogicAnd)* { return tail.reduce((result, element) => {
        return { 
            id: nextId(), 
            type: "BinaryExpression", 
            operator: element[1], 
            left: result, 
            right: element[3] 
        };
      }, head);
  }

LogicAnd  
  = head:Equality tail:(_ "&&" _ Equality)* {
      return tail.reduce((result, element) => {
        return { 
            id: nextId(), 
            type: "BinaryExpression", 
            operator: element[1], 
            left: result, 
            right: element[3] 
        };
      }, head);
  }

Equality 
  = head:Relational tail:(_ ("==" / "!=") _ Relational)* {
      return tail.reduce((result, element) => {
        return { 
            id: nextId(), 
            type: "BinaryExpression", 
            operator: element[1], 
            left: result, 
            right: element[3] 
        };
      }, head);
  }

Relational
  = head:AddSub tail:(_ ("<=" / ">=" / "<" / ">") _ AddSub)* {
      return tail.reduce((result, element) => {
        return { 
            id: nextId(), 
            type: "BinaryExpression", 
            operator: element[1], 
            left: result, 
            right: element[3] 
        };
      }, head);
  }

AddSub
 = head:Term tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce((result, element) => {
        return { 
            id: nextId(), 
            type: "BinaryExpression", 
            operator: element[1], 
            left: result, 
            right: element[3] 
        };
      }, head);
    }

Term
  = head:Factor tail:(_ ("*" / "/" / "%") _ Factor)* {
      return tail.reduce((result, element) => {
        return { 
            id: nextId(), 
            type: "BinaryExpression", 
            operator: element[1], 
            left: result, 
            right: element[3] 
        };
      }, head);
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; } 
  / FunctionCall      
  / UpdateExpression  
  / ArrayAccess       
  / Identifier        
  / Literal           

ArrayAccess
  = name:Identifier _ "[" _ index:Expression _ "]" _ "[" _ index2:Expression _ "]" {
      return { 
          id: nextId(), 
          type: "ArrayAccess2D", 
          name: name, 
          index: index,
          index2: index2
      };
  }
  / name:Identifier _ "[" _ index:Expression _ "]" {
      return { 
          id: nextId(), 
          type: "ArrayAccess", 
          name: name, 
          index: index 
      };
  }

UpdateExpression
  = name:Identifier _ op:("++" / "--") {
       return { 
           id: nextId(), 
           type: "UpdateExpression", 
           operator: op, 
           argument: name,
           prefix: false
       };
  }
  / op:("++" / "--") _ name:Identifier {
       return { 
           id: nextId(), 
           type: "UpdateExpression", 
           operator: op, 
           argument: name,
           prefix: true 
       };
  }

UpdateStatement
  = name:Identifier _ op:("++" / "--") _ ";" {
      return {
        id: nextId(),
        type: "UpdateExpression",
        operator: op,
        argument: name, 
        isStatement: true,
        line: location().start.line
      };
  }
  / op:("++" / "--") _ name:Identifier _ ";" {
      return {
        id: nextId(),
        type: "UpdateExpression",
        operator: op,
        argument: name,
        prefix: true,
        isStatement: true,
        line: location().start.line
      };
  }

// --- 5. TOKENS ---
Type
  = "unsigned" _ "long" _ "long" { return "unsigned long long"; }
  / "long" _ "long"              { return "long long"; }
  / "long" _ "double"            { return "long double"; }
  / "unsigned" _ "int"           { return "unsigned int"; }
  / "unsigned"                 { return "unsigned int"; }
  / "short"
  / "long"
  / "int"
  / "float"
  / "double"
  / "char"
  / "string"
  / "bool"
  / "void"
  / "auto"

Literal
  = FloatLiteral / IntegerLiteral / StringLiteral / CharLiteral / BoolLiteral

IntegerLiteral 
  = [0-9]+ { return { type: "Literal", value: parseInt(text()), dataType: "int", raw: text() }; }

StringLiteral "String"
  = '"' chars:DoubleStringCharacter* '"' { 
      return { 
        type: "Literal", 
        value: chars.join(""), 
        dataType: "string", 
        raw: text() 
      }; 
  }

DoubleStringCharacter
  = !('"' / "\\\\") char:. { return char; } 
  / "\\\\" sequence:EscapeSequence { return sequence; }

FloatLiteral 
  = [0-9]+ "." [0-9]+ { return { type: "Literal", value: parseFloat(text()), dataType: "float", raw: text() }; }

CharLiteral 
  = "'" char:[^'] "'" { return { type: "Literal", value: char, dataType: "char", raw: text() }; }

BoolLiteral 
  = ("true" / "false") { return { type: "Literal", value: text() === "true", dataType: "bool", raw: text() }; }

EscapeSequence
  = "'"
  / '"'
  / "\\\\" 
  / "n"  { return "\\n"; }
  / "r"  { return "\\r"; }
  / "t"  { return "\\t"; }

Identifier
  = !Keyword first:[a-zA-Z_] rest:[a-zA-Z0-9_]* { return text(); }

Keyword
  = ("int" / "float" / "double" / "char" / "string" / "bool" / "void" / "auto"
  / "short" / "long" / "unsigned" / "const" / "typedef"
  / "if" / "else" / "while" / "for" / "switch" / "case" / "default"
  / "return" / "break" / "continue"
  / "cout" / "cin" / "endl" / "using" / "namespace" / "true" / "false") !([a-zA-Z0-9_])

ArrayIndex = "[" _ expr:Expression _ "]" { 
    return { 
        flatStr: text().substring(1, text().length-1),
        node: expr 
    }; 
}
ForInit 
  = decl:Declaration { return text(); } 
  / assign:Assignment { return text(); } 
  / _ ";" { return ""; }

_ 
  = ([ \\t\\n\\r] / Comment)*

Comment 
  = "//" (![\\n] .)* / "/*" (!"*/" .)* "*/"
`;

export class CodeSenseParser {
  private parser: any;
  private initError: string | null = null; 

  constructor() {
    try {
      // @ts-ignore
      this.parser = peg.generate(grammarSource);
    } catch (e: any) {
      console.error("PARSER INIT FAILED:", e);
      this.initError = e.message; 
    }
  }

  public parse(code: string): ASTNode[] {
    if (this.initError) {
        throw new Error(`Grammar Error: ${this.initError}`);
    }
    
    if (!this.parser) {
        throw new Error("Parser is undefined (Unknown Error)");
    }

    try {
      const program = this.parser.parse(code);
      return program;
    } catch (error: any) {
      if (error.location) {
        throw new Error(
          `Syntax Error at Line ${error.location.start.line}: ${error.message}`
        );
      }
      throw error;
    }
  }
}