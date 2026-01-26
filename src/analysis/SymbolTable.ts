export class SymbolTable {
    private scopes: Map<string, string>[] = [];
    private typeDefinitions: Map<string, string>[] = []; // Stores typedefs

    constructor() {
        this.enterScope(); // Global scope
    }

    enterScope() {
        this.scopes.push(new Map());
        this.typeDefinitions.push(new Map());
    }

    exitScope() {
        if (this.scopes.length > 1) {
            this.scopes.pop();
            this.typeDefinitions.pop();
        }
    }

    // Register a variable (e.g., "int x")
    declare(name: string, type: string): boolean {
        const currentScope = this.scopes[this.scopes.length - 1];
        if (currentScope.has(name)) return false;
        currentScope.set(name, type);
        return true;
    }

    // Register a Type Alias (e.g., "typedef int km")
    defineType(alias: string, originalType: string) {
        const currentTypeScope = this.typeDefinitions[this.typeDefinitions.length - 1];
        currentTypeScope.set(alias, originalType);
    }

    // Find variable type
    lookup(name: string): string | null {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name)) return this.scopes[i].get(name)!;
        }
        return null;
    }

    // Resolve a type (e.g., "km" -> "int")
    resolveType(typeName: string): string {
        // Check if it's a primitive
        if (['int', 'float', 'string', 'bool', 'void'].includes(typeName)) return typeName;
        
        // Look up typedefs
        for (let i = this.typeDefinitions.length - 1; i >= 0; i--) {
            if (this.typeDefinitions[i].has(typeName)) {
                return this.resolveType(this.typeDefinitions[i].get(typeName)!); // Recursive resolution
            }
        }
        return 'unknown'; // Custom type not found
    }
}