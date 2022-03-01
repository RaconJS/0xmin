//node.js version 16
//BODGED
//UNFINISHED
//NEEDSTESTING
//TESTING
//TODO
//UNUSED
+process.version.match(/[0-9]+/g)[0]>=16;
try {1??{}?.(2)}catch(e){throw Error("This 0xmin compiler requires node.js version 16.")}
function loga(...args){console.log(...args);};
//tabify object
const tabs=(obj,b=0)=>JSON.stringify(obj)
	.replace(/([{},])/g,(n,v1)=>{
		if(v1=="{")return v1+"\n"+"\t".repeat(++b);
		if(v1=="}")return "\n"+"\t".repeat(--b)+v1;
		if(v1==",")return v1+"\n"+"\t".repeat(b);
	})
	.replace(/({)\s+(})\s*(,)?/g,(n,v1,v2,v3)=>v1+v2+v3)
;
const oxminCompiler=async function(inputFile,fileName){
	"compiler error: type error;";
	const wordsRegex=
	/\/\/[\s\S]*?(?:\n|$)|\/\*[\s\S]*?\*\/|(["'`])(?:[\s\S]*?[^\\])?\1|\b0x(?:[a-f][A-F])+\b|0b[01]+|[0-9]+|\s+|[\w_]+|[=-]>|::|\.{1,3}|[&|\^]{1,2}|={1,3}|>{1,3}|<{1,2}|[!\$%*()-+=\[\]{};:@#~\\|,/?]/g
	;
	const nameRegex=/^[\w_]/;
	//(long string,string) => (array of words)
	function parseFile(inputFile,fileName){
		let words=inputFile.match(wordsRegex)??[];
		words.fileName=fileName;
		//remove comments
		for(let i=0;i<words.length;i++){
			if(words[i].match(/^\/[\/*]|^\s/)){
				words.splice(i,1);
				i--;
			}
		}
		words.i=0;
		return words;
	}
	const bracketMap=Object.freeze({
		"{":"}",
		"[":"]",
		"(":")",
	});
	const bracketClassMap=Object.freeze({//this object is for debugging
		"{":({"{ }":class extends Array{}})["{ }"],
		"[":({"[ ]":class extends Array{}})["[ ]"],
		"(":({"( )":class extends Array{}})["( )"],
	});
	function bracketPass(words,type="{",includeBrackets=false){
		words.i??=0;
		let block=new bracketClassMap[type]??[];//the current container: {...} or [...] or (...)
		let statement=[];//the current item: '...;' or '...,'
		if(includeBrackets){//[...] => ['{',...,'}']
			if(words[words.i]!=type)throw Error("compiler error");
			block.push(words[words.i]);
			words.i++;
		}
		let brackets=0;
		for(let i=words.i,len=words.length;i<len&&words.i<words.length;i++){
			let word=words[words.i];
			if(word in bracketMap){//handle brackets '{...}' ==> ['{',[...],'}'];
				words.i++;
				statement.push(word,//{
					bracketPass(words,word,false)//...
				,bracketMap[word]);//}
				words.i++;
			}
			else if((word=="," && type!="{")||(word == ";" && type=="{")){//then: new statement
				//';' only belongs to codeObjs, and not expressions
				statement.push(word);
				words.i++;
				block.push(statement);
				statement=[];
			}
			else if(word=="}"||(type!="{" && ";)]}".includes(word))){
				block.push(statement);//ends the block
				break;
			}
			else{
				statement.push(word);
				words.i++;
			}
		}
		if(includeBrackets){//[...] => ['{',...,'}']
			if(words[words.i]!=bracketMap[type])throw Error("unballanced "+type+" brackets");
			block.push(words[words.i]);
			words.i++;
		}
		return block;
	}
	const contexts={
		string({index,statement,scope}){//is optional
			if("\"'`".includes(statement[index][0])){
				let rawString=statement[index];
				index++;
				let string=JSON.parse(rawString);
				return {index,value:string};
			}else{
				return {index,value:undefined};
			}
		},
		number({index,statement,scope}){//is optional
			let number=+statement[index];
			if(!isNaN(number)){
				index++;
				return {index,value:number};
			}else{
				return {index,value:undefined};
			}
		},
		async main_meta({statement,index,scope}){//'#' ==> '# let set a;'
			let metaState={
				"let":false,
				"set":false,
				"def":false,
			};
			let word=statement[index];
			let found=false;
			while(["let","set","def"].includes(word=statement[index])){
				metaState[word]=true;
				index++;
				found=true;
			}
			if(!found){
				metaState["set"]=true;
			}
			if(metaState["let"]){
				let value;
				({value,index}=await contexts.expression_short({statement,index,scope}));
				let labelParent=value.parent??scope.scopes.let;
				if(metaState["set"])labelParent.labels[value.name]=value.label;
				else labelParent.labels[value.name]??=value.label;
			}
			({index}=await contexts.expression({statement,index,scope}));
			return {index};
		},
		async main_assembly_arguments({statement,index,scope,instruction}){//'get' 
			for(let i=index;i<statement.length;i++){//returns a list of Value's/strings/numbers 
				if(index>=statement.length)break;
				let word=statement[index];
				let value;
				if(({index,value}=contexts.number({index,statement})).value!=undefined){//'2'
					instruction.args.push(value);
					continue;
				}
				else if(word.match(nameRegex)){//'command' or 'label'
					let value;
					({value,index}=await contexts.expression_short({statement,index,scope,includeBrackets:false}));
					instruction.args.push(value);
					continue;
				}
				else if(["("].includes(word)){
					let value;
					({value,index}=await contexts.expression_short({statement,index,scope,includeBrackets:true}));
					instruction.args.push(value);
					continue;
				}
				if(word=="["){
					index++;
					let newScope=new Scope({parent:scope});
					newScope.label=new Variable({parent:newScope});
					value=new Value({type:"scope",name:"[",label:newScope});
					instruction.args.push(statement[index]);
					index++;
					continue;
				}
				if("@$#:;])}".includes(word))break;
				else{
					instruction.args.push(word);
					continue;
				}
			}
			return{index};
		},
		async main_assembly({statement,index,scope,codeObj}){
			if(!(codeObj instanceof Variable))throw Error("compiler error: type error;");
			{
				let value;
				let instruction;
				let useInstruction=false;//use 'instruction' in the codeObj, false => meta only code.
				({value,index}=await contexts.expression_short({statement,index,scope}));
				if(!value){//';'undefined value
					useInstruction=false;
					}
				else if(value.type=="number"){
					instruction=new AssemblyLine({
						type:"data",
						dataType:"number",
						args:[value.number],
					});
					useInstruction=true;
				}
				else if(value.type=="string"){
					codeObj.code.push(...value.string.split("").map(v=>new AssemblyLine({
						type:"data",
						dataType:"char",
						args:[assemblyCompiler.assembly.extraInstructions.string_char,v.charCodeAt(0)],
					})));
					useInstruction=false;
				}
				else{
					instruction=new AssemblyLine({
						type:"command",
						args:[value],
					});
					useInstruction=true;
				}
				if(instruction){//arguments
					({index}=await contexts.main_assembly_arguments({index,statement,scope,instruction}));
					if(instruction.args.length>0){
						useInstruction=true;
					}
					if(instruction.args.length==1&&typeof instruction.args[0]=="number"){
						instruction.binaryValue=instruction.args[0];
						instruction.type="data";
					}else{
						instruction.type="command";
					}
				}
				if(useInstruction){
					codeObj.code.push(instruction);
				}
			}
			return {index,value:codeObj};
		},
		//'...scope;
		async injectCode({statement,index,scope}){//UNFINISHED
			if(statement[index]=="..."){
				index++;
			}
			else{
				return{index};
			}
			let value;
			({index,value}=await contexts.expression_short({statement,index,scope}));
			value.array;
			return{index};
		},
		async main({statement,index=0,scope},part=0){//codeObj; Bash-like statements
			let codeObj=new Variable({type:"code line",});
			let newScope=new Scope({label:codeObj,parent:scope});
			let state={void:false,static:false,phase:"@"};
			statement.maxRecur;
			statement.recur??=0;
			statement.recur++;
			let word=statement[index];let asd=2;
			if(index>=statement.length)return{index,value:newScope};
			if(statement.maxRecur<=(1??maxRecur))
			if(["void","static","#","$","@"].includes(word))
			loop:for(let i=index;i<statement.length;i++){
				let word=statement[index];
				if("#$@".includes(word)){
					state.phase=word;
					index++;
				}
				switch(word){
					case"void":{
						state.phase="void";
					}break;
					case"static":{
						state.phase="void";
					}break;
					case":":{
						break loop;
					}break;
					default:{
						break loop;
					}
				}
			}
			if(["repeat","recur"].includes(word)){//repeat 10: recur 10:
				index++;
				let repeatingIndex_number=index;
				let calcReps=async()=>{
					let value;
					({index,value}=await contexts.expression_short({statement,index:repeatingIndex_number,scope}));
					return value.number;
				}
				if(word=="repeat"){
					let maxReps=await calcReps();
					if(statement[index]==":")index++;
					let repeatingIndex=index;
					for(let i=0;i<maxReps;i++){
						maxReps=Math.min(maxReps,await calcReps());
						await contexts.main({statement,index:repeatingIndex,scope});
					}
					return {index};
				}
				else if(word=="recur"){
					if(statement.maxRecur==undefined||statement.maxRecur<maxReps){
						statement.maxRecur=await calcReps();
					}
					if(statement[index]==":")index++;
					return await contexts.main({statement,index,scope});
				}
			}
			if(statement[index]=="{"){
				index++;
				await evalBlock(statement[index++],false,contexts.main,scope);
				index++;
			}
			assemblyPart:{
				let value;
				if(state.phase=="@")({index,value}=await contexts.main_assembly({statement,index,scope,codeObj}));
				;
				word=statement[index];
				if(word=="#")index++;
				({index,value}=await contexts.main_meta({statement,index,scope,codeObj}));
				;
			}
			statement.recur--;
			if(statement.recur==0){
				statement.maxRecur=undefined;
			}
			if(!state.void){
				scope.label.code.push(codeObj);
			}
			return {index,value:newScope};
		},
		async parameter(){},
		async argument(){},
		async expression_short({index,statement,scope}){//a().b or (1+1)
			let value;
			let word=statement[index];
			if("([{".includes(word)){//'(label)'
				({index,value}=await contexts.expression({index,statement,scope,includeBrackets:true}));
			}else if(({index,value}=await contexts.number({index,statement,scope})).value!=undefined) {
				//'12'
				let number=value;
				value=new Value({number,type:"number",bool:!!number});
			}else if(({index,value}=await contexts.string({index,statement,scope})).value!=undefined) {
				//'"abc"'
				let string=value;
				value=new Value({string,type:"string"});
			}else if(word.match(nameRegex)){//'label'
				value=new Value();
				value.name=word;
				value.label=scope.findlabel(value.name);
				index++;
			}
			else{
				//value=new Value();
				return {index,value:undefined};
			}
			for(let i=index;i<statement.length;i++){//'.asd'
				if(index>=statement.length)break;
				let word=statement[index];
				({value,index}=await contexts.extend_value({index,statement,scope,value}));
			}
			return {value,index};
		},
		//expression_short:
			async extend_value({index,statement,scope,value}){//.b or [] or ()
				if(value.type=="undefined"||value==undefined)value=scope;//'(.b)' == 'b'
				let word=statement[index];
				if([".",".."].includes(word)){// 'a.'
					let parent=value.label;
					value.parent=parent;
					let oldIndex=index;
					if(word==".."){//UNFINISHED
						value.label={};//internal object
					}
					index++;
					let name,nameFound=false;
					word=statement[index];
					//optional expression
					if(name==undefined){
						if(word.match(nameRegex)){//'a.b' ?
							name=word;
							nameFound=true;
						}
					}
					if(!nameFound){//'a.123' ?
						({index,value}=await contexts.number({index,statement,}));
					}
					if(!nameFound){//'a.("b")' ?
						({index,value}=await contexts.expression({index,statement,scope,includeBrackets:true}));
						name=value?.string;
						if(value)nameFound=true;
					}
					if(!nameFound){
						throw Error("'"+statement[oldIndex]+"'"+" does not return a property name");
					}
					value.name=name;
					value.label=parent.labels[name];
				}else{
					return {index,value};
				}
			},
		//----
		async expression({index,statement,scope,includeBrackets=true}){//a + b
			const operatorRegex=/[+\-*/]/;
			let value=new Value();
			const argsObj=new Variable({code:[]});
			const args=argsObj.code;
			let word=statement[index];
			let nextIndex=index;
			if(includeBrackets){
				if(includeBrackets && !"([{".includes(word)){
					return {index,value:undefined};//expression not found
				}
				nextIndex=index+3;//including brackets
				statement=statement[index+1];
				index=0;
				//label,number,array:[function]
				statement=statement[index];
			}
			//UNFINISHED
			for(let i=index;i<statement.length;i++){
				let word=statement[index];
				if(word.match(operatorRegex)){
					args.push(word);
				}
				else {
					let value;
					({index,value}=await contexts.expression_short({index,statement,scope}));
					args.push(value);
				}
			}
			for(const arg of args){
				;
			}
			value=args[0];
			if(includeBrackets)return {index:nextIndex,value};
			else{
				return {index,value};
			}
		},
	};
	assemblyCompiler={
		async main(scope){
			const {assemblyCode}=await this.collectCode(scope.label);//(Variable) -> Variable
			const machineCode=this.compileAssembly(assemblyCode);//(Variable) -> MachineCode
			return machineCode;
		},
		async collectCode(codeObj,assemblyCode=new Variable(),lineNumber){//collects assembly code
			if(!codeObj instanceof Variable)throw Error("compiler error: 'scope.label' is undefined.");
			const code=codeObj.code;
			lineNumber??=codeObj.address??0;
			for(const lineObj of code){//lineObj instanceof AssemblyLine
				if(lineObj instanceof HiddenLine){
					({lineNumber}=await assemblyCompiler.evalHiddenLine({lineObj,lineNumber,assemblyCode,codeObj}));
				}else if(lineObj instanceof AssemblyLine){
					let {machineCode}=assemblyCompiler.compileAssemblyLine({lineObj,assemblyCode,lineNumber});
					assemblyCode.code[lineNumber++]=machineCode;
				}else if(lineObj instanceof Variable){
					({lineNumber}=await assemblyCompiler.collectCode(lineObj,assemblyCode,lineNumber));
				}
			}
			return {lineNumber,assemblyCode};
		},
		//$ phase
			compileAssemblyLine({lineObj,assemblyCode,lineNumber}){
				if(!(lineObj instanceof AssemblyLine))throw Error("compiler error: type error;");
				if(!(assemblyCode instanceof Variable))throw Error("compiler error: type error;");
				if(!(typeof lineNumber == "number"))throw Error("compiler error: type error;");
				const machineCode=new AssemblyLine(lineObj);
				let binaryCode;
				let command=lineObj.args[0]?.name;
				if(command in this.assembly.instructionSet){
					binaryCode|=this.assembly.instructionSet[command];
				}
				machineCode.binaryValue=binaryCode;
				return {machineCode};
			},
			async evalHiddenLine({lineObj,lineNumber,assemblyCode,codeObj}){//eval's $ or # code in the '$' phase
				//UNFINISHED
				return {lineNumber};
			},
		//----
		//@ phase
			assembly:{//0xmin assembly language
				instructionSet:{
					"move":0,
					"jump":1,
					"nor":2,
					"red":3,
					"blue":4,
					"set":5,
				},
				pointers:{
					"jump":0,
					"move":0
				},
				registers:{

				},
				extraInstructions:{
					string_char   :0x20020000,//0x10??,
					string_pos    :0x20021000,//0x1???, //0x1yyx
					string_col    :0x20022000,//0x20??, //background,textColor
					string_confirm:0x20010000, //0x20030000,
				},
				machineCodeArgs:[
					[0,4],
					[4,8],
					[12,1],
				],//[starting bit number,length of argument (in bits)]
			},
			nullValue:null,//will be defined later
			decodeArgument(args,argNumber=0,type="command"){
				let arg=args[argNumber];
				if(arg instanceof Value){
					if(arg.name in this.assembly.instructionSet){
						arg=this.assembly.instructionSet[arg.name];
					}
					else if(arg.type=="label"&&arg.label){
						arg=arg.label;
					}
				}else if(typeof arg=="string"){
					if(arg in this.assembly.instructionSet){
						arg=this.assembly.instructionSet[arg];
					}
				}
				return arg;
			},
			compileAssembly(assemblyCode){//ordered assembly code
				if(!(assemblyCode instanceof Variable))throw Error("compiler error: type error;");
				const code=assemblyCode.code;
				const machineCode=new MachineCode();
				const nullValue=this.nullValue;
				for(let i=0;i<code.length;i++){
					let binaryValue=0;
					const instruction=code[i];//instruction:AssemblyLine
					let outputInstruction=instruction;//new AssemblyLine({binaryValue:0});
					if(!instruction||instruction==nullValue){
						machineCode.code.push(nullValue);
						continue;
					}
					else machineCode.code.push(outputInstruction);
					let arg=instruction.args[0];
					let number;
					for(let i=0;i<instruction.args.length;i++){
						arg=instruction.args[i];
						arg=this.decodeArgument(instruction.args,i);
						let binaryArg;
						if(typeof arg=="number"){
							switch(instruction.type){
								case"data":binaryValue|=binaryArg=arg;break;
								case"command":binaryValue|=binaryArg=
									(arg&((1<<this.assembly.machineCodeArgs[i][1])-1))
									<<this.assembly.machineCodeArgs[i][0];break;
							}
							continue;
						}
						if(!arg){
							binaryValue=nullValue.binaryValue; 
						}
					}
					instruction.binaryValue=binaryValue;
				}
				return machineCode;
			},
		//----
	};
	//classes
		///@abstract
		class Operator{
			constructor(word){
				this.operator=word;
			}
			operator;
		}
		class DataClass{
			//constructor(data){Object.assign(this,data??{})}
		}
		class Value extends DataClass{
			constructor(data){super();Object.assign(this,data??{})}
			parent;//parent.name ==> label
			label;//label Object
			name;//label name
			type="label";
			bool=false;
			number=0;//relAddress
			array=[];//code
		}
		Value.Number=class extends Value{type="number";}
		class Stack{//UNUSED
			list=[];
			constructor(list){
				if(list instanceof Stack){
					;
				}
			}
		}
		///@abstract
		class CodeLine extends DataClass{//assembly line of code
			//constructor(data){super();Object.assign(this,data??{})}
			type="number";///number,string,command
			args=[];///Value[];
		}
		class AssemblyLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
			//binaryValue is the final value of this line of code.
			//also used in meta (#) phase represent the value.
			binaryValue=undefined;
			dataType=undefined;//optional used with e.g.'String.char(5)' in '"text";'
			command;
			data;
		}
		class HiddenLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
			command;
		}
		class MetaLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
		}
		;
		class Variable extends DataClass{// codeObj/label
			constructor(data){super();Object.assign(this,data??{})}
			//value
			type="label";
			//object
			labels={};//aka properties
			prototype=null;
			supertype=null;
			//function
			code=[];//array
			parameters={};
			scope=null;//the scope that the code should be called with.
			//assembly
			relAddress=0;//number
			defineLine=null;//instanceof AssemblyLine
			get address(){
				const address=this.defineLine?.address;
				return address==undefined?undefined:address+this.relAddress;
			}
			findLabel(name){//'a.b'
				return
					this.supertype?.findlabel?.(name)
					??this.labels[name]
					??this.prototype?.findlabel?.(name)
				;
			}
		}
		class MachineCode extends Variable{
			constructor(data){super();Object.assign(this,data??{});}
			asBinary(){
				return this.code.map(v=>v.binaryValue);
			}
		}
		class Scope extends DataClass{//type of codeObj
			constructor(data){
				super();Object.assign(this,data??{});
				if(data?.parent){
					this.var??=data.parent.var;
					this.let??=data.parent.let;
				}
			}
			label=null;//label that owns this scope, label contains properties.
			//scopes
				parent=null;
				var=null;
				let=null;
			//----
			isSearched=false;
			findlabel(name){return this.findLabelParent(name)?.labels?.[name];}
			findLabelParent(name,topLevel=true){
				if(this.isSearched||!this.label)return undefined;
				if(name in this.label?.labels)return this;
				if(this.parent){
					this.isSearched=true;
					let parent=this.parent.findLabelParent(name);
					this.isSearched=false;
					return parent;
				}
				else return undefined;
			}
		}
	//----
	{
		assemblyCompiler.nullValue=new AssemblyLine({
			type:"undefined",
			args:[0],
			binaryValue:0,
		});
	}
	async function evalBlock(block,includeBrackets=false,context=contexts.main,scope=undefined){
		if(!scope){
			scope=new Scope({parent:undefined});
			scope.label=new Variable();
		}
		let bracketType="{";//default value: '{'
		if(includeBrackets){
			bracketType=block[0];
		}
		for(let i=0;i<block.length-includeBrackets;i++){
			const statement=block[i];
			if(context)await context({statement,scope})
			else for(const word of statement){
				let part;
				if(word instanceof Array){
					part=await evalBlock(block,true,true);
				}
				else{
					if(word.match(/\/[*/]/))continue;//ignore comments
					part=word;
				}
			}
		}
		return scope;
	}
	async function evalAssembly(scope){
		let assemblyCode=await assemblyCompiler.main(scope);
		return assemblyCode;
	}
	let parts=inputFile;
	parts=parseFile(parts,fileName);
	parts=bracketPass(parts);
	parts=await evalBlock(parts);
	parts=await evalAssembly(parts);
	//chars->words->expresion->statement->codeObj->block
	//
	let outputFile=parts.asBinary();
	let outputBinary=new Uint32Array(outputFile);
	loga(outputBinary)
	return outputBinary;
};
let buildSettings={makeFile:true}
{
	let jsFolderDir=process.argv[1].split("/");jsFolderDir.pop();jsFolderDir=jsFolderDir.join("/")
	if(process.argv.length<3||!process.argv[2].match(/\.0xmin$|compile.js/)){
		[
		  '...node',//node.js
		  '...compile.js',//
		  '...inFile.0xmin',
		  '...outFileName.out',
		]
		console.error(errorMsg+"needs input .0xmin file");
		return;
		throw "needs input .0xmin file";
	}
	else{
		const fs = require('fs');
		oxminCompiler.fileLoader=fileName=>new Promise((resolve,reject)=>{
			fs.readFile(fileName, 'utf8' , (err, data) => {
			if(err){
				throw Error(err);//failed to read input file
				reject(err);
			}
			let inputFile =data;
			resolve(inputFile);
		})});
		let fileLoader=(async()=>{
			let fileName=process.argv[2];//name
			if(fileName.match(/compile.js$/)){
				fileName="testCode.0xmin";
			}
			let inputFile=await oxminCompiler.fileLoader(fileName);
			return [inputFile,fileName];
		})();
		let outputFile=null;
		let fileWriter=()=>new Promise((resolve,reject)=>{//minFilt.lua or a.filt
			let newFileName=process.argv[3];
			if(!newFileName&&!buildSettings.makeFile){resolve("no file");return;}
			else{console.log("made file")}
			newFileName??="minFilt.lua";//??"a.filt"??"minFilt.lua";
			let fileType=newFileName.match(/(?<=\.)[^.]*$/)?.[0]??"filt";
			let content=outputFile;
			if(fileType=="lua"){
				let varName=newFileName.replaceAll(".", "_");
				content="minFilt={"+outputFile+"}";
			}
			fs.writeFile(newFileName, content, err => {
				if (err)reject(err);
				else resolve();
				//file written successfully
			})
		});
		(async function(){
			let [inputFile,fileName]=await fileLoader;
			outputFile=await oxminCompiler(inputFile,fileName);
			await fileWriter();
			return outputFile;
		})();
	}
}
//13959