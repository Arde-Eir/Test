import { Node, Edge } from 'reactflow';
import { ASTNode } from '../types';

interface LayerNode {
  id: string;
  layer: number;
  position: number;
  data: any;
  type: string;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export class ImprovedSugiyamaLayout {
  private nodeWidth = 200;
  private nodeHeight = 60;
  private horizontalSpacing = 100;
  private verticalSpacing = 120;
  private nodes: Map<string, LayerNode> = new Map();
  private edges: GraphEdge[] = [];
  private layers: string[][] = [];

  generateGraph(ast: ASTNode[]): { nodes: Node[]; edges: Edge[] } {
    console.log('🎨 Starting Improved Sugiyama Layout');
    console.log('📥 Received AST:', ast);
    
    this.nodes.clear();
    this.edges = [];
    this.layers = [];

    this.processAST(ast);

    if (this.nodes.size === 0) {
      console.warn('⚠️ No nodes to layout - creating fallback graph');
      this.createFallbackGraph();
    }

    if (this.nodes.size === 0) {
      console.error('❌ Still no nodes after fallback');
      return { nodes: [], edges: [] };
    }

    this.assignLayers();
    this.reduceCrossings();
    this.assignCoordinates();

    const flowNodes = this.createFlowNodes();
    const flowEdges = this.createFlowEdges();

    console.log('✅ Layout complete:', flowNodes.length, 'nodes,', flowEdges.length, 'edges');
    
    return { nodes: flowNodes, edges: flowEdges };
  }

  private createFallbackGraph() {
    console.log('🔧 Creating fallback visualization graph');
    
    this.addNode('fallback-start', 'START', 'input', { label: 'START' });
    this.addNode('fallback-process', 'Processing Code...', 'default', { label: 'Processing Code...' });
    this.addNode('fallback-end', 'END', 'output', { label: 'END' });
    
    this.addEdge('fallback-start', 'fallback-process');
    this.addEdge('fallback-process', 'fallback-end');
    
    console.log('✅ Fallback graph created with', this.nodes.size, 'nodes');
  }

  private processAST(nodes: ASTNode[]) {
    console.log('🔍 Processing AST:', nodes);
    
    if (!nodes || nodes.length === 0) {
      console.warn('⚠️ Empty AST received');
      return;
    }

    nodes.forEach((node: any, index: number) => {
      console.log(`📦 Node ${index}:`, node.type, node);
      
      if (node.type === 'FunctionDefinition') {
        console.log('✅ Found FunctionDefinition:', node.name);
        if (node.name === 'main') {
          this.processFunctionBody(node);
        }
        return;
      }

      if (node.type === 'Program' && node.body) {
        console.log('📂 Found Program node, recursing into body');
        this.processAST(node.body);
        return;
      }

      if (node.type === 'Main' && node.body) {
        console.log('✅ Found Main node');
        this.processFunctionBody({ ...node, name: 'main', type: 'FunctionDefinition' });
        return;
      }

      if (node.name === 'main' && node.body) {
        console.log('✅ Found main by name');
        node.type = node.type || 'FunctionDefinition';
        this.processFunctionBody(node);
        return;
      }

      if (node.statements || node.body) {
        console.log('📂 Found node with statements/body');
        const wrappedNode = {
          type: 'FunctionDefinition',
          name: 'main',
          body: node.statements || node.body,
          ...node
        };
        this.processFunctionBody(wrappedNode);
        return;
      }
    });

    console.log('📊 Total nodes created:', this.nodes.size);
    console.log('📊 Total edges created:', this.edges.length);
  }

  private processFunctionBody(func: any) {
    console.log('🏗️ Processing function:', func.name);
    console.log('🏗️ Function body:', func.body);
    
    const startId = `start-${func.name}`;
    this.addNode(startId, 'START', 'input', { label: 'START' });

    let lastId = startId;
    if (func.body && Array.isArray(func.body) && func.body.length > 0) {
      console.log(`📝 Processing ${func.body.length} statements in function body`);
      lastId = this.processStatements(func.body, startId);
    } else {
      console.warn('⚠️ Function has no body or empty body');
    }

    const endId = `end-${func.name}`;
    this.addNode(endId, 'END', 'output', { label: 'END' });
    this.addEdge(lastId, endId);
    
    console.log('✅ Function processing complete');
  }

  private processStatements(statements: any[], previousId: string): string {
    let currentId = previousId;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const nextId = this.processStatement(stmt, currentId, i);
      currentId = nextId;
    }

    return currentId;
  }

  private processStatement(stmt: any, previousId: string, index: number): string {
    if (!stmt || !stmt.type) {
      console.warn('⚠️ Invalid statement:', stmt);
      return previousId;
    }

    const nodeId = `node-${index}-${stmt.type}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔨 Processing statement: ${stmt.type}`, stmt);

    switch (stmt.type) {
      case 'VariableDeclaration':
        const varValue = stmt.value || stmt.initializer || stmt.init || '?';
        let varLabel = `${stmt.dataType || 'var'} ${stmt.name || stmt.identifier || '?'}`;
        
        // NEW: Show 2D array declaration
        if (stmt.is2D && Array.isArray(stmt.arraySize)) {
          varLabel += `[${stmt.arraySize[0]}][${stmt.arraySize[1]}]`;
        } else if (stmt.isArray) {
          varLabel += `[${stmt.arraySize}]`;
        }
        
        varLabel += ` = ${varValue}`;
        
        this.addNode(nodeId, varLabel, 'data', {
          label: varLabel,
          lineNumber: stmt.line || stmt.location?.start?.line,
          narrative: `Declare variable ${stmt.name} and set it to ${varValue}`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      // NEW: Typedef Declaration
      case 'TypedefDeclaration':
        const typedefLabel = `typedef ${stmt.baseType} ${stmt.newName}`;
        this.addNode(nodeId, typedefLabel, 'data', {
          label: typedefLabel,
          lineNumber: stmt.line,
          narrative: `Create type alias ${stmt.newName} for ${stmt.baseType}`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      case 'WhileLoop':
      case 'WhileStatement':
        return this.processWhileLoop(stmt, previousId, index);

      case 'ForLoop':
      case 'ForStatement':
        return this.processForLoop(stmt, previousId, index);

      case 'IfStatement':
      case 'If':
        return this.processIfStatement(stmt, previousId, index);

      // NEW: Switch Statement
      case 'SwitchStatement':
        return this.processSwitchStatement(stmt, previousId, index);

      case 'CoutStatement':
      case 'OutputStatement':
      case 'Output':
      case 'PrintStatement':
        const outputExpr = stmt.expression || stmt.value || stmt.arguments?.[0] || '...';
        const outputLabel = `cout << ${this.formatExpression(outputExpr)}`;
        this.addNode(nodeId, outputLabel, 'output', {
          label: outputLabel,
          lineNumber: stmt.line || stmt.location?.start?.line,
          narrative: `Output ${this.formatExpression(outputExpr)} to the console`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      case 'CinStatement':
        const inputVars = Array.isArray(stmt.value) ? stmt.value.join(', ') : stmt.value;
        const inputLabel = `cin >> ${inputVars}`;
        this.addNode(nodeId, inputLabel, 'data', {
          label: inputLabel,
          lineNumber: stmt.line,
          narrative: `Read input into ${inputVars}`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      case 'Assignment':
      case 'AssignmentStatement':
      case 'AssignmentExpression':
        const target = stmt.variable || stmt.target || stmt.left || stmt.name || '?';
        const value = stmt.value || stmt.expression || stmt.right || '...';
        const assignLabel = `${this.formatExpression(target)} ${stmt.operator || '='} ${this.formatExpression(value)}`;
        this.addNode(nodeId, assignLabel, 'action', {
          label: assignLabel,
          lineNumber: stmt.line || stmt.location?.start?.line,
          narrative: `Set ${this.formatExpression(target)} to ${this.formatExpression(value)}`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      case 'ReturnStatement':
      case 'Return':
        const retValue = stmt.value || stmt.expression || stmt.argument || '0';
        const returnLabel = `return ${this.formatExpression(retValue)}`;
        this.addNode(nodeId, returnLabel, 'output', {
          label: returnLabel,
          lineNumber: stmt.line || stmt.location?.start?.line,
          narrative: `Return ${this.formatExpression(retValue)} from the function`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      case 'BreakStatement':
        this.addNode(nodeId, 'break', 'control', {
          label: 'break',
          lineNumber: stmt.line,
          narrative: 'Exit the current loop or switch'
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      case 'ContinueStatement':
        this.addNode(nodeId, 'continue', 'control', {
          label: 'continue',
          lineNumber: stmt.line,
          narrative: 'Skip to next iteration'
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      case 'ExpressionStatement':
        if (stmt.expression) {
          const exprLabel = this.formatExpression(stmt.expression);
          this.addNode(nodeId, exprLabel, 'action', {
            label: exprLabel,
            lineNumber: stmt.line || stmt.location?.start?.line,
            narrative: `Execute: ${exprLabel}`
          });
          this.addEdge(previousId, nodeId);
          return nodeId;
        }
        return previousId;

      case 'UpdateExpression':
      case 'UnaryExpression':
        const updateLabel = this.formatExpression(stmt);
        this.addNode(nodeId, updateLabel, 'action', {
          label: updateLabel,
          lineNumber: stmt.line || stmt.location?.start?.line,
          narrative: `Update: ${updateLabel}`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;

      default:
        console.warn('⚠️ Unknown statement type:', stmt.type);
        const defaultLabel = stmt.type || 'Unknown';
        this.addNode(nodeId, defaultLabel, 'default', {
          label: defaultLabel,
          lineNumber: stmt.line || stmt.location?.start?.line,
          narrative: `Execute ${defaultLabel}`
        });
        this.addEdge(previousId, nodeId);
        return nodeId;
    }
  }

  private formatExpression(expr: any): string {
    if (!expr) return '...';
    if (typeof expr === 'string') return expr;
    if (typeof expr === 'number') return String(expr);
    if (typeof expr === 'boolean') return String(expr);
    
    if (expr.type === 'BinaryExpression') {
      const left = this.formatExpression(expr.left || expr.leftOperand);
      const right = this.formatExpression(expr.right || expr.rightOperand);
      return `${left} ${expr.operator} ${right}`;
    }
    
    if (expr.type === 'UnaryExpression') {
      const arg = this.formatExpression(expr.argument || expr.operand);
      return expr.operator === '++' || expr.operator === '--' 
        ? `${arg}${expr.operator}`
        : `${expr.operator}${arg}`;
    }
    
    if (expr.type === 'UpdateExpression') {
      const arg = this.formatExpression(expr.argument || expr.operand);
      return expr.prefix 
        ? `${expr.operator}${arg}`
        : `${arg}${expr.operator}`;
    }
    
    if (expr.type === 'Identifier') {
      return expr.name || expr.value || '?';
    }
    
    if (expr.type === 'Literal' || expr.type === 'NumericLiteral' || expr.type === 'StringLiteral') {
      return String(expr.value);
    }

    if (expr.type === 'CallExpression') {
      const callee = this.formatExpression(expr.callee);
      return `${callee}()`;
    }

    // NEW: Array Access
    if (expr.type === 'ArrayAccess') {
      return `${expr.name}[${this.formatExpression(expr.index)}]`;
    }

    // NEW: 2D Array Access
    if (expr.type === 'ArrayAccess2D') {
      return `${expr.name}[${this.formatExpression(expr.index)}][${this.formatExpression(expr.index2)}]`;
    }
    
    if (expr.name) return expr.name;
    if (expr.value !== undefined) return String(expr.value);
    
    return JSON.stringify(expr).substring(0, 50);
  }

  // NEW: Enhanced If Statement with else-if support
  private processIfStatement(ifStmt: any, previousId: string, index: number): string {
    const conditionId = `if-cond-${index}`;
    const mergeId = `if-merge-${index}`;

    this.addNode(conditionId, `if (${ifStmt.condition || '...'})`, 'control', {
      label: `if (${ifStmt.condition || '...'})`,
      lineNumber: ifStmt.line,
      narrative: `Check if condition ${ifStmt.condition} is true`
    });
    this.addEdge(previousId, conditionId);

    // Process true branch
    let trueLastId = conditionId;
    if (ifStmt.body && ifStmt.body.length > 0) {
      trueLastId = this.processStatements(ifStmt.body, conditionId);
    }
    this.addEdge(trueLastId, mergeId, 'True');

    // NEW: Process else-if clauses
    let elseIfLastId = conditionId;
    if (ifStmt.elseIfs && ifStmt.elseIfs.length > 0) {
      ifStmt.elseIfs.forEach((elseIf: any, i: number) => {
        const elseIfId = `else-if-${index}-${i}`;
        this.addNode(elseIfId, `else if (${elseIf.condition})`, 'control', {
          label: `else if (${elseIf.condition})`,
          lineNumber: elseIf.line,
          narrative: `Otherwise, check if ${elseIf.condition} is true`
        });
        this.addEdge(conditionId, elseIfId, 'False');

        let elseIfBodyLast = elseIfId;
        if (elseIf.body && elseIf.body.length > 0) {
          elseIfBodyLast = this.processStatements(elseIf.body, elseIfId);
        }
        this.addEdge(elseIfBodyLast, mergeId, 'True');
        
        elseIfLastId = elseIfId;
      });
    }

    // Process else branch
    if (ifStmt.alternate && ifStmt.alternate.length > 0) {
      const elseId = `else-${index}`;
      this.addNode(elseId, 'else', 'control', {
        label: 'else',
        narrative: 'All conditions were false, execute else block'
      });
      this.addEdge(elseIfLastId, elseId, 'False');
      
      const elseLastId = this.processStatements(ifStmt.alternate, elseId);
      this.addEdge(elseLastId, mergeId);
    } else {
      this.addEdge(elseIfLastId, mergeId, 'False');
    }

    this.addNode(mergeId, 'Merge', 'control', {
      label: 'Merge',
      narrative: 'All branches converge here'
    });

    return mergeId;
  }

  // NEW: Switch Statement Processor
  private processSwitchStatement(switchStmt: any, previousId: string, index: number): string {
    const switchId = `switch-${index}`;
    const mergeId = `switch-merge-${index}`;

    this.addNode(switchId, `switch (${switchStmt.discriminant})`, 'control', {
      label: `switch (${switchStmt.discriminant})`,
      lineNumber: switchStmt.line,
      narrative: `Check value of ${switchStmt.discriminant} against cases`
    });
    this.addEdge(previousId, switchId);

    // Process cases
    if (switchStmt.cases && switchStmt.cases.length > 0) {
      switchStmt.cases.forEach((caseNode: any, i: number) => {
        const caseId = `case-${index}-${i}`;
        const caseValue = this.formatExpression(caseNode.value);
        
        this.addNode(caseId, `case ${caseValue}`, 'control', {
          label: `case ${caseValue}`,
          lineNumber: caseNode.line,
          narrative: `If value equals ${caseValue}`
        });
        this.addEdge(switchId, caseId, caseValue);

        let caseLastId = caseId;
        if (caseNode.body && caseNode.body.length > 0) {
          caseLastId = this.processStatements(caseNode.body, caseId);
        }
        this.addEdge(caseLastId, mergeId);
      });
    }

    // Process default case
    if (switchStmt.defaultCase) {
      const defaultId = `default-${index}`;
      this.addNode(defaultId, 'default', 'control', {
        label: 'default',
        lineNumber: switchStmt.defaultCase.line,
        narrative: 'No case matched, execute default'
      });
      this.addEdge(switchId, defaultId, 'default');

      let defaultLastId = defaultId;
      if (switchStmt.defaultCase.body && switchStmt.defaultCase.body.length > 0) {
        defaultLastId = this.processStatements(switchStmt.defaultCase.body, defaultId);
      }
      this.addEdge(defaultLastId, mergeId);
    }

    this.addNode(mergeId, 'End Switch', 'control', {
      label: 'End Switch',
      narrative: 'Switch statement ends'
    });

    return mergeId;
  }

  private processForLoop(loop: any, previousId: string, index: number): string {
    const conditionId = `for-cond-${index}`;
    const loopEndId = `for-end-${index}`;

    const condition = loop.condition || loop.test || '...';
    this.addNode(conditionId, `for (${this.formatExpression(condition)})`, 'control', {
      label: `for (${this.formatExpression(condition)})`,
      lineNumber: loop.line || loop.location?.start?.line,
      narrative: `Loop while ${this.formatExpression(condition)} is true`
    });
    this.addEdge(previousId, conditionId);

    let bodyLastId = conditionId;
    if (loop.body && Array.isArray(loop.body) && loop.body.length > 0) {
      bodyLastId = this.processStatements(loop.body, conditionId);
    }

    this.addEdge(bodyLastId, conditionId, 'Repeat');

    this.addNode(loopEndId, 'Loop End', 'control', {
      label: 'Loop End',
      narrative: 'Exit the loop'
    });
    this.addEdge(conditionId, loopEndId, 'False');

    return loopEndId;
  }

  private processWhileLoop(loop: any, previousId: string, index: number): string {
    const conditionId = `while-cond-${index}`;
    const loopEndId = `while-end-${index}`;

    const condition = loop.condition || loop.test || '...';
    const condLabel = `while (${this.formatExpression(condition)})`;
    
    this.addNode(conditionId, condLabel, 'control', {
      label: condLabel,
      lineNumber: loop.line || loop.location?.start?.line,
      narrative: `Check if ${this.formatExpression(condition)} is true`
    });
    this.addEdge(previousId, conditionId);

    let bodyLastId = conditionId;
    if (loop.body && Array.isArray(loop.body) && loop.body.length > 0) {
      console.log(`  🔄 Processing ${loop.body.length} statements in while loop body`);
      bodyLastId = this.processStatements(loop.body, conditionId);
    } else {
      console.warn('  ⚠️ While loop has empty body');
    }

    this.addEdge(bodyLastId, conditionId, 'Repeat');

    this.addNode(loopEndId, 'Exit Loop', 'control', {
      label: 'Exit Loop',
      narrative: `Condition ${this.formatExpression(condition)} is false, exit the loop`
    });
    this.addEdge(conditionId, loopEndId, 'False');

    return loopEndId;
  }

  private addNode(id: string, label: string, type: string, data: any = {}) {
    this.nodes.set(id, {
      id,
      layer: 0,
      position: 0,
      data: { ...data, label },
      type
    });
  }

  private addEdge(source: string, target: string, label?: string) {
    this.edges.push({ source, target, label });
  }

  private assignLayers() {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    this.nodes.forEach((_, id) => {
      inDegree.set(id, 0);
      adjList.set(id, []);
    });

    this.edges.forEach(edge => {
      if (edge.label !== 'Repeat') {
        adjList.get(edge.source)?.push(edge.target);
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
    });

    const queue: string[] = [];
    
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
        const node = this.nodes.get(id);
        if (node) node.layer = 0;
      }
    });

    let currentLayer = 0;
    while (queue.length > 0) {
      const layerSize = queue.length;
      const nextLayer: string[] = [];

      for (let i = 0; i < layerSize; i++) {
        const nodeId = queue.shift()!;
        const neighbors = adjList.get(nodeId) || [];

        neighbors.forEach(neighbor => {
          const newDegree = (inDegree.get(neighbor) || 0) - 1;
          inDegree.set(neighbor, newDegree);

          if (newDegree === 0) {
            nextLayer.push(neighbor);
            const node = this.nodes.get(neighbor);
            if (node) node.layer = currentLayer + 1;
          }
        });
      }

      queue.push(...nextLayer);
      currentLayer++;
    }

    this.layers = [];
    this.nodes.forEach(node => {
      while (this.layers.length <= node.layer) {
        this.layers.push([]);
      }
      this.layers[node.layer].push(node.id);
    });

    console.log('📊 Layers assigned:', this.layers.length, 'layers');
  }

  private reduceCrossings() {
    const maxIterations = 10;

    for (let iter = 0; iter < maxIterations; iter++) {
      let swapped = false;

      for (let i = 1; i < this.layers.length; i++) {
        swapped = this.reorderLayer(i, true) || swapped;
      }

      for (let i = this.layers.length - 2; i >= 0; i--) {
        swapped = this.reorderLayer(i, false) || swapped;
      }

      if (!swapped) break;
    }
  }

  private reorderLayer(layerIndex: number, forward: boolean): boolean {
    const layer = this.layers[layerIndex];
    const positions = new Map<string, number>();

    layer.forEach(nodeId => {
      const neighbors = forward 
        ? this.getTargets(nodeId)
        : this.getSources(nodeId);

      if (neighbors.length > 0) {
        const neighborPositions = neighbors
          .map(n => this.nodes.get(n)?.position || 0)
          .sort((a, b) => a - b);
        
        const median = neighborPositions[Math.floor(neighborPositions.length / 2)];
        positions.set(nodeId, median);
      } else {
        positions.set(nodeId, this.nodes.get(nodeId)?.position || 0);
      }
    });

    const sorted = [...layer].sort((a, b) => {
      return (positions.get(a) || 0) - (positions.get(b) || 0);
    });

    const changed = sorted.some((id, i) => id !== layer[i]);

    this.layers[layerIndex] = sorted;
    sorted.forEach((id, pos) => {
      const node = this.nodes.get(id);
      if (node) node.position = pos;
    });

    return changed;
  }

  private getTargets(nodeId: string): string[] {
    return this.edges
      .filter(e => e.source === nodeId && e.label !== 'Repeat')
      .map(e => e.target);
  }

  private getSources(nodeId: string): string[] {
    return this.edges
      .filter(e => e.target === nodeId && e.label !== 'Repeat')
      .map(e => e.source);
  }

  private assignCoordinates() {
    this.layers.forEach((layer) => {
      layer.forEach((nodeId, position) => {
        const node = this.nodes.get(nodeId);
        if (node) {
          node.position = position;
        }
      });
    });
  }

  private createFlowNodes(): Node[] {
    const flowNodes: Node[] = [];

    this.layers.forEach((layer, layerIndex) => {
      const y = layerIndex * this.verticalSpacing;
      const layerWidth = layer.length * (this.nodeWidth + this.horizontalSpacing);
      const startX = -layerWidth / 2;

      layer.forEach((nodeId, position) => {
        const node = this.nodes.get(nodeId);
        if (!node) return;

        const x = startX + position * (this.nodeWidth + this.horizontalSpacing);

        flowNodes.push({
          id: nodeId,
          type: node.type,
          position: { x, y },
          data: {
            label: node.data.label,
            lineNumber: node.data.lineNumber,
            narrative: node.data.narrative || this.generateNarrative(node)
          }
        });
      });
    });

    return flowNodes;
  }

  private createFlowEdges(): Edge[] {
    return this.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: edge.label === 'Repeat' ? 'default' : 'smoothstep',
      animated: edge.label === 'Repeat',
      style: {
        stroke: edge.label === 'Repeat' 
          ? '#facc15' 
          : edge.label === 'False' 
            ? '#ef4444' 
            : edge.label === 'True'
              ? '#4ade80'
              : '#60a5fa',
        strokeWidth: 2,
        strokeDasharray: edge.label === 'Repeat' ? '5,5' : undefined
      },
      labelStyle: {
        fill: '#fff',
        fontSize: 10,
        fontWeight: 'bold'
      },
      labelBgStyle: {
        fill: '#222',
        fillOpacity: 0.8
      }
    }));
  }

  private generateNarrative(node: LayerNode): string {
    const label = node.data.label;
    
    if (label === 'START') return 'Program execution begins here';
    if (label === 'END') return 'Program execution ends here';
    if (label.startsWith('int ') || label.startsWith('float ')) {
      return `Declare and initialize variable: ${label}`;
    }
    if (label.startsWith('typedef ')) {
      return `Create type alias: ${label}`;
    }
    if (label.startsWith('while ')) {
      return `Loop continues as long as condition is true: ${label}`;
    }
    if (label.startsWith('for ')) {
      return `For loop: ${label}`;
    }
    if (label.startsWith('if ') || label.startsWith('else if ')) {
      return `Check condition: ${label}`;
    }
    if (label.startsWith('switch ')) {
      return `Switch on value: ${label}`;
    }
    if (label.startsWith('case ')) {
      return `Case: ${label}`;
    }
    if (label === 'default') {
      return 'Default case when no other case matches';
    }
    if (label === 'else') {
      return 'Else: Execute when all conditions are false';
    }
    if (label.startsWith('cout ')) {
      return `Output to console: ${label}`;
    }
    if (label.startsWith('cin ')) {
      return `Read input: ${label}`;
    }
    if (label.includes('=')) {
      return `Update variable: ${label}`;
    }
    if (label.startsWith('return')) {
      return `Return value: ${label}`;
    }
    if (label === 'break') {
      return 'Break out of loop or switch';
    }
    if (label === 'continue') {
      return 'Continue to next iteration';
    }
    
    return label;
  }
}