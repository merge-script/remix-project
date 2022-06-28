'use strict'
import { Plugin } from '@remixproject/engine'
import { sourceMappingDecoder } from '@remix-project/remix-debug'
import { CompilerAbstract } from '@remix-project/remix-solidity'
import { Compiler } from '@remix-project/remix-solidity'

import { AstNode, CompilationError, CompilationResult, CompilationSource } from '@remix-project/remix-solidity'
import { helper } from '@remix-project/remix-solidity'

import React from 'react'
import { fileState, fileStateType } from '@remix-ui/file-states'
// eslint-disable-next-line


const SolidityParser = (window as any).SolidityParser = (window as any).SolidityParser || []

const profile = {
    name: 'codeParser',
    methods: ['nodesAtPosition', 'getFunctionParamaters', 'getDeclaration', 'getFunctionReturnParameters', 'getVariableDeclaration', 'getNodeDocumentation', 'getNodeLink', 'listAstNodes', 'getBlockAtPosition', 'getLastNodeInLine', 'resolveImports', 'parseSolidity', 'getNodesWithScope', 'getNodesWithName', 'getNodes', 'compile', 'getNodeById', 'getLastCompilationResult', 'positionOfDefinition', 'definitionAtPosition', 'jumpToDefinition', 'referrencesAtPosition', 'referencesOf', 'getActiveHighlights', 'gasEstimation', 'declarationOf'],
    events: [],
    version: '0.0.1'
}

export function isNodeDefinition(node: any) {
    return node.nodeType === 'ContractDefinition' ||
        node.nodeType === 'FunctionDefinition' ||
        node.nodeType === 'ModifierDefinition' ||
        node.nodeType === 'VariableDeclaration' ||
        node.nodeType === 'StructDefinition' ||
        node.nodeType === 'EventDefinition'
}

export class CodeParser extends Plugin {

    currentFileAST: any // contains the simple parsed AST for the current file
    compiler: any // used to compile the current file seperately from the main compiler
    lastCompilationResult: any
    currentFile: any
    _index: any
    astWalker: any
    errorState: boolean = false
    onAstFinished: (success: any, data: CompilationResult, source: CompilationSource, input: any, version: any) => Promise<void>

    constructor(astWalker) {
        super(profile)
        this.astWalker = astWalker
        this._index = {
            Declarations: {},
            FlatReferences: {}
        }
    }

    async onActivation() {
        this.on('editor', 'contentChanged', async () => {
            console.log('contentChanged')
            await this.getCurrentFileAST()
            await this.compile()
        })

        this.on('fileManager', 'currentFileChanged', async () => {
            await this.getCurrentFileAST()
            await this.compile()
        })

        this.on('solidity', 'loadingCompiler', async (url) => {
            console.log('loading compiler', url)
            this.compiler.loadVersion(true, url)
            this.compiler.event.register('compilerLoaded', async () => {
                console.log('compiler loaded')
            })
        })

        /**
         * - processes compilation results
         * - calls the editor to add markers on the errors 
         * - builds the flat index of nodes
         */
        this.onAstFinished = async (success, data: CompilationResult, source: CompilationSource, input: any, version) => {
            console.log('compile success', success, data, this)
            this.call('editor', 'clearAnnotations')
            this.errorState = true
            let noFatalErrors = true // ie warnings are ok
            const checkIfFatalError = (error: CompilationError) => {
                // Ignore warnings and the 'Deferred import' error as those are generated by us as a workaround
                const isValidError = (error.message && error.message.includes('Deferred import')) ? false : error.severity !== 'warning'
                if (isValidError) {
                    console.log(error)
                    noFatalErrors = false
                }
            }
            const result = new CompilerAbstract('soljson', data, source, input)

            if (data.error) checkIfFatalError(data.error)
            if (data.errors) data.errors.forEach((err) => checkIfFatalError(err))
            const allErrors = []
            if (data.errors) {
                for (const error of data.errors) {
                    console.log('ERROR POS', error)
                    const pos = helper.getPositionDetails(error.formattedMessage)
                    console.log('ERROR POS', pos)
                    const sources = result.getSourceCode().sources
                    const source = sources[pos.file]
                    const lineColumn = await this.call('offsetToLineColumnConverter', 'offsetToLineColumn',
                        {
                            start: error.sourceLocation.start,
                            length: error.sourceLocation.end - error.sourceLocation.start
                        },
                        0,
                        sources,
                        null)
                    console.log('lineColumn', lineColumn)
                    allErrors.push({ error, lineColumn })
                }
                console.log('allErrors', allErrors)
                await this.call('editor', 'addErrorMarker', allErrors)

                for(const error of allErrors){
                    
                }


                try {
                   
                    let fileState:fileState = {
                        path: this.currentFile,
                        isDirectory: false,
                        fileStateType: fileStateType.Custom,
                        fileStateLabelClass: 'text-success',
                        fileStateIconClass: '',
                        fileStateIcon: <i className="text-success fas fa-smile"></i>,
                        comment: '',
                        owner: 'code-parser',
                        bubble: true
                    }
                    await this.call('fileStates', 'setFileState', fileState)
                    fileState = {
                        ...fileState,
                        fileStateLabelClass: 'text-danger',
                        fileStateIcon: <i className="text-danger fas fa-spinner fa-spin"></i>,
                    }
                    fileState = {
                        ...fileState,
                        path: 'scripts/ethers-lib.ts',
                        fileStateLabelClass: 'text-danger',
                        fileStateIcon: <div className='btn btn-danger btn-sm'>call rob now!</div>,
                    }
                    await this.call('fileStates', 'setFileState', fileState)

                    const states:fileState[] = [
                        {
                            path: 'contracts/2_Owner.sol',
                            isDirectory: false,
                            fileStateType: fileStateType.Custom,
                            fileStateLabelClass: 'text-success',
                            fileStateIconClass: '',
                            fileStateIcon: <i className="text-success fas fa-smile"></i>,
                            comment: '',
                            owner: 'code-parser',
                            bubble: true
                        },
                        {
                            path: 'contracts/2_Owner.sol',
                            isDirectory: false,
                            fileStateType: fileStateType.Custom,
                            fileStateLabelClass: 'text-danger',
                            fileStateIconClass: '',
                            fileStateIcon: <i className="text-danger fas fa-smile"></i>,
                            comment: '',
                            owner: 'code-parser',
                            bubble: true
                        }
                    ]

                    await this.call('fileStates', 'setFileState', states)

                    
                } catch (e) { 
                    console.log('error calling filePanel', e)
                }
            } else {
                await this.call('fileStates', 'setFileState', [{
                    path: this.currentFile,
                    isDirectory: false,
                    fileStateType: [],
                    fileStateClass: '',
                    comment: '',
                    owner: 'code-parser',
                    bubble: true
                }])
                await this.call('editor', 'clearErrorMarkers', result.getSourceCode().sources)
            }


            if (!data.sources) return
            if (data.sources && Object.keys(data.sources).length === 0) return
            this.lastCompilationResult = new CompilerAbstract('soljson', data, source, input)
            this.errorState = false
            this._index = {
                Declarations: {},
                FlatReferences: {}
            }
            this._buildIndex(data, source)
            this.emit('astFinished')
        }

        this.compiler = new Compiler((url, cb) => this.call('contentImport', 'resolveAndSave', url, undefined, true).then((result) => cb(null, result)).catch((error) => cb(error.message)))
        this.compiler.event.register('compilationFinished', this.onAstFinished)
    }

    // COMPILER

    /**
     * 
     * @returns 
     */
    async compile() {
        try {
            const state = await this.call('solidity', 'getCompilerState')
            this.compiler.set('optimize', state.optimize)
            this.compiler.set('evmVersion', state.evmVersion)
            this.compiler.set('language', state.language)
            this.compiler.set('runs', state.runs)
            this.compiler.set('useFileConfiguration', state.useFileConfiguration)
            this.currentFile = await this.call('fileManager', 'file')
            console.log(this.currentFile)
            if (!this.currentFile) return
            const content = await this.call('fileManager', 'readFile', this.currentFile)
            const sources = { [this.currentFile]: { content } }
            this.compiler.compile(sources, this.currentFile)
        } catch (e) {
            console.log(e)
        }
    }

    /**
     * 
     * @returns 
     */
    async getLastCompilationResult() {
        return this.lastCompilationResult
    }

    /*
    * simple parsing is used to quickly parse the current file or a text source without using the compiler or having to resolve imports
    */

    async parseSolidity(text: string) {
        const t0 = performance.now();
        const ast = (SolidityParser as any).parse(text, { loc: true, range: true, tolerant: true })
        const t1 = performance.now();
        console.log(`Call to doSomething took ${t1 - t0} milliseconds.`);
        console.log('AST PARSE SUCCESS', ast)
        return ast
    }

    /**
     * Tries to parse the current file or the given text and returns the AST
     * If the parsing fails it returns the last successful AST for this file
     * @param text 
     * @returns 
     */
    async getCurrentFileAST(text: string | null = null) {
        this.currentFile = await this.call('fileManager', 'file')
        if (!this.currentFile) return
        const fileContent = text || await this.call('fileManager', 'readFile', this.currentFile)
        try {
            const ast = await this.parseSolidity(fileContent)

            this.currentFileAST = ast
            console.log('AST PARSE SUCCESS', ast)
        } catch (e) {
            console.log(e)
        }
        console.log('LAST PARSER AST', this.currentFileAST)
        return this.currentFileAST
    }

    /**
     * Builds a flat index and declarations of all the nodes in the compilation result
     * @param compilationResult 
     * @param source 
     */
    _buildIndex(compilationResult, source) {
        if (compilationResult && compilationResult.sources) {
            const callback = (node) => {
                if (node && node.referencedDeclaration) {
                    if (!this._index.Declarations[node.referencedDeclaration]) {
                        this._index.Declarations[node.referencedDeclaration] = []
                    }
                    this._index.Declarations[node.referencedDeclaration].push(node)
                }
                this._index.FlatReferences[node.id] = node
            }
            for (const s in compilationResult.sources) {
                this.astWalker.walkFull(compilationResult.sources[s].ast, callback)
            }
            console.log("INDEX", this._index)
        }
    }

    // NODE HELPERS

    /**
    * Returns the block surrounding the given position
    * For example if the position is in the middle of a function, it will return the function
    * @param {position} position
    * @param {string} text // optional
    * @return {any}
    * */
    async getBlockAtPosition(position: any, text: string = null) {
        console.log('GET BLOCK AT ', position)
        await this.getCurrentFileAST(text)
        const allowedTypes = ['SourceUnit', 'ContractDefinition', 'FunctionDefinition']

        const walkAst = (node) => {
            console.log(node)
            if (node.loc.start.line <= position.lineNumber && node.loc.end.line >= position.lineNumber) {
                const children = node.children || node.subNodes
                if (children && allowedTypes.indexOf(node.type) !== -1) {
                    for (const child of children) {
                        const result = walkAst(child)
                        if (result) return result
                    }
                }
                return node
            }
            return null
        }
        if (!this.currentFileAST) return
        return walkAst(this.currentFileAST)
    }

    /**
     * Lists the AST nodes from the current file parser
     * These nodes need to be changed to match the node types returned by the compiler
     * @returns 
     */
    async listAstNodes() {
        await this.getCurrentFileAST();
        const nodes = [];
        (SolidityParser as any).visit(this.currentFileAST, {
            StateVariableDeclaration: (node) => {
                if (node.variables) {
                    for (const variable of node.variables) {
                        nodes.push({ ...variable, nodeType: 'VariableDeclaration' })
                    }
                }
            },
            VariableDeclaration: (node) => {
                nodes.push({ ...node, nodeType: node.type })
            },
            UserDefinedTypeName: (node) => {
                nodes.push({ ...node, nodeType: node.type })
            },
            FunctionDefinition: (node) => {
                nodes.push({ ...node, nodeType: node.type })
            },
            ContractDefinition: (node) => {
                nodes.push({ ...node, nodeType: node.type })
            },
            MemberAccess: function (node) {
                nodes.push({ ...node, nodeType: node.type })
            },
            Identifier: function (node) {
                nodes.push({ ...node, nodeType: node.type })
            },
            EventDefinition: function (node) {
                nodes.push({ ...node, nodeType: node.type })
            },
            ModifierDefinition: function (node) {
                nodes.push({ ...node, nodeType: node.type })
            },
            InvalidNode: function (node) {
                nodes.push({ ...node, nodeType: node.type })
            }
        })
        console.log("LIST NODES", nodes)
        return nodes
    }

    /**
     * Nodes at position where position is a number, offset
     * @param position 
     * @param type 
     * @returns 
     */
    async nodesAtPosition(position: number, type = '') {
        const lastCompilationResult = this.lastCompilationResult
        if (!lastCompilationResult) return false
        const urlFromPath = await this.call('fileManager', 'getUrlFromPath', this.currentFile)
        if (lastCompilationResult && lastCompilationResult.languageversion.indexOf('soljson') === 0 && lastCompilationResult.data && lastCompilationResult.data.sources && lastCompilationResult.data.sources[this.currentFile]) {
            const nodes = sourceMappingDecoder.nodesAtPosition(type, position, lastCompilationResult.data.sources[this.currentFile] || lastCompilationResult.data.sources[urlFromPath.file])
            return nodes
        }
        return []
    }

    /**
     * 
     * @param id 
     * @returns 
     */
    async getNodeById(id: any) {
        for (const key in this._index.FlatReferences) {
            if (this._index.FlatReferences[key].id === id) {
                return this._index.FlatReferences[key]
            }
        }
    }

    /**
     * 
     * @param id 
     * @returns 
     */
    async getDeclaration(id: any) {
        if (this._index.Declarations && this._index.Declarations[id]) return this._index.Declarations[id]
    }

    /**
     * 
     * @param scope 
     * @returns 
     */
    async getNodesWithScope(scope: number) {
        const nodes = []
        for (const node of Object.values(this._index.FlatReferences) as any[]) {
            if (node.scope === scope) nodes.push(node)
        }
        return nodes
    }

    /**
     * 
     * @param name 
     * @returns 
     */
    async getNodesWithName(name: string) {
        const nodes = []
        for (const node of Object.values(this._index.FlatReferences) as any[]) {
            if (node.name === name) nodes.push(node)
        }
        return nodes
    }
    /**
     * 
     * @param node 
     * @returns 
     */
    declarationOf(node: AstNode) {
        if (node && node.referencedDeclaration) {
            return this._index.FlatReferences[node.referencedDeclaration]
        } else {
            // console.log(this._index.FlatReferences)
        }
        return null
    }

    /**
     * 
     * @param position 
     * @returns 
     */
    async definitionAtPosition(position: number) {
        const nodes = await this.nodesAtPosition(position)
        console.log('nodes at position', nodes, position)
        console.log(this._index.FlatReferences)
        let nodeDefinition: any
        let node: any
        if (nodes && nodes.length && !this.errorState) {
            node = nodes[nodes.length - 1]
            nodeDefinition = node
            if (!isNodeDefinition(node)) {
                nodeDefinition = await this.declarationOf(node) || node
            }
            if (node.nodeType === 'ImportDirective') {
                for (const key in this._index.FlatReferences) {
                    if (this._index.FlatReferences[key].id === node.sourceUnit) {
                        nodeDefinition = this._index.FlatReferences[key]
                    }
                }
            }
            return nodeDefinition
        } else {
            const astNodes = await this.listAstNodes()
            for (const node of astNodes) {
                if (node.range[0] <= position && node.range[1] >= position) {
                    if (nodeDefinition && nodeDefinition.range[0] < node.range[0]) {
                        nodeDefinition = node
                    }
                    if (!nodeDefinition) nodeDefinition = node
                }
            }
            if (nodeDefinition && nodeDefinition.type && nodeDefinition.type === 'Identifier') {
                const nodeForIdentifier = await this.findIdentifier(nodeDefinition)
                if (nodeForIdentifier) nodeDefinition = nodeForIdentifier
            }
            return nodeDefinition
        }

    }

    /**
     * 
     * @param identifierNode 
     * @returns 
     */
    async findIdentifier(identifierNode: any) {
        const astNodes = await this.listAstNodes()
        for (const node of astNodes) {
            if (node.name === identifierNode.name && node.nodeType !== 'Identifier') {
                return node
            }
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async positionOfDefinition(node: any): Promise<any | null> {
        if (node) {
            if (node.src) {
                const position = sourceMappingDecoder.decode(node.src)
                if (position) {
                    return position
                }
            }
        }
        return null
    }

    /**
     * 
     * @param node 
     * @param imported 
     * @returns 
     */
    async resolveImports(node, imported = {}) {
        if (node.nodeType === 'ImportDirective' && !imported[node.sourceUnit]) {
            console.log('IMPORTING', node)
            const importNode = await this.getNodeById(node.sourceUnit)
            imported[importNode.id] = importNode
            if (importNode.nodes) {
                for (const child of importNode.nodes) {
                    imported = await this.resolveImports(child, imported)
                }
            }
        }
        console.log(imported)
        return imported
    }

    /**
     * 
     * @param ast 
     * @returns 
     */
    async getLastNodeInLine(ast: string) {
        let lastNode
        const checkLastNode = (node) => {
            if (lastNode && lastNode.range && lastNode.range[1]) {
                if (node.range[1] > lastNode.range[1]) {
                    lastNode = node
                }
            } else {
                lastNode = node
            }
        }

        (SolidityParser as any).visit(ast, {
            MemberAccess: function (node) {
                checkLastNode(node)
            },
            Identifier: function (node) {
                checkLastNode(node)
            }
        })
        if (lastNode && lastNode.expression && lastNode.expression.expression) {
            console.log('lastNode with expression', lastNode, lastNode.expression)
            return lastNode.expression.expression
        }
        if (lastNode && lastNode.expression) {
            console.log('lastNode with expression', lastNode, lastNode.expression)
            return lastNode.expression
        }
        console.log('lastNode', lastNode)
        return lastNode
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    referencesOf(node: any) {
        const results = []
        const highlights = (id) => {
            if (this._index.Declarations && this._index.Declarations[id]) {
                const refs = this._index.Declarations[id]
                for (const ref in refs) {
                    const node = refs[ref]
                    results.push(node)
                }
            }
        }
        if (node && node.referencedDeclaration) {
            highlights(node.referencedDeclaration)
            const current = this._index.FlatReferences[node.referencedDeclaration]
            results.push(current)
        } else {
            highlights(node.id)
        }
        return results
    }

    /**
     * 
     * @param position 
     * @returns 
     */
    async referrencesAtPosition(position: any) {
        const nodes = await this.nodesAtPosition(position)
        if (nodes && nodes.length) {
            const node = nodes[nodes.length - 1]
            if (node) {
                return this.referencesOf(node)
            }
        }
    }

    /**
     * 
     * @returns 
     */
    async getNodes() {
        return this._index.FlatReferences
    }



    /**
     * 
     * @param node 
     * @returns 
     */
    async getNodeLink(node: any) {
        const position = await this.positionOfDefinition(node)
        if (position) {
            const filename = this.lastCompilationResult.getSourceName(position.file)
            const lineColumn = await this.call('offsetToLineColumnConverter', 'offsetToLineColumn',
                position,
                position.file,
                this.lastCompilationResult.getSourceCode().sources,
                this.lastCompilationResult.getAsts())
            return `${filename} ${lineColumn.start.line}:${lineColumn.start.column}`
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getNodeDocumentation(node: any) {
        if (node.documentation && node.documentation.text) {
            let text = ''
            node.documentation.text.split('\n').forEach(line => {
                text += `${line.trim()}\n`
            })
            return text
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getVariableDeclaration(node: any) {
        if (node.typeDescriptions && node.typeDescriptions.typeString) {
            return `${node.typeDescriptions.typeString} ${node.visibility}${node.name && node.name.length ? ` ${node.name}` : ''}`
        } else {
            if (node.typeName && node.typeName.name) {
                return `${node.typeName.name} ${node.visibility}${node.name && node.name.length ? ` ${node.name}` : ''}`
            }
            else if (node.typeName && node.typeName.namePath) {
                return `${node.typeName.namePath} ${node.visibility}${node.name && node.name.length ? ` ${node.name}` : ''}`
            }
            else {
                return `${node.visibility}${node.name && node.name.length ? ` ${node.name}` : ''}`
            }
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getFunctionParamaters(node: any) {
        const localParam = (node.parameters && node.parameters.parameters) || (node.parameters)
        if (localParam) {
            const params = []
            for (const param of localParam) {
                params.push(await this.getVariableDeclaration(param))
            }
            return `(${params.join(', ')})`
        }
    }

    /**
     * 
     * @param node 
     * @returns 
     */
    async getFunctionReturnParameters(node: any) {
        const localParam = (node.returnParameters && node.returnParameters.parameters)
        if (localParam) {
            const params = []
            for (const param of localParam) {
                params.push(await this.getVariableDeclaration(param))
            }
            return `(${params.join(', ')})`
        }
    }



}