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
	const wordsRegex=//does not include: /\s+/
	/\/\/[\s\S]*?(?:\n|$)|\/\*[\s\S]*?\*\/|(["'`])(?:\1|[\s\S]*?[^\\]\1)|\b0x(?:[0-9]|[a-f]|[A-F])+\b|0b[01]+|[0-9]+|[\w_]+|[=-]>|::|\.{1,3}|[&|\^]{1,2}|={1,3}|>{1,3}|<{1,2}|[!\$%*()-+=\[\]{};:@#~\\|,/?]/g
	;
	const nameRegex=/^[\w_]/;
	//(long string,string) => (array of words)
	function parseFile(inputFile,fileName){
		"use strict";
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
	function bracketPass(words,type="{",includeBrackets=false,stackLevel=0){
		//stackLevel is for debugging only
		words.i??=0;
		let block=new bracketClassMap[type]??[];//the current container: {...} or [...] or (...)
		let statement=[];//the current item: '...;' or '...,'
		if(includeBrackets){//[...] => ['{',...,'}']
			if(words[words.i]!=type)throw Error("compiler error");
			block.push(words[words.i]);
			words.i++;
		}
		let brackets=0;
		for(let i=words.i,len=words.length;i<len+4&&words.i<words.length;i++){
			let word=words[words.i];
			let TEST=words.i==words.length-1;
			if(word in bracketMap){//handle brackets '{...}' ==> ['{',[...],'}'];
				words.i++;
				statement??=[];
				statement.push(word,//{
					bracketPass(words,word,false,stackLevel+1)//...
				,bracketMap[word]);//}
				words.i++;
			}
			else if((word=="," && type!="{")||((word == ";") && type=="{")){//then: new statement
				statement??=[];
				//';' only belongs to codeObjs, and not expressions
				statement.push(word);
				words.i++;
				block.push(statement);
				statement=undefined;//makes a new statement next cycle
			}
			else if(word=="}"||(type!="{" && ";)]}".includes(word))){
				if(statement)
				block.push(statement);//ends the block
				statement=undefined;
				break;
			}
			else if(0){
				;
			}
			else{
				statement??=[];
				statement.push(word);
				words.i++;
			}
		}
		if(statement)block.push(statement);
		if(includeBrackets){//[...] => ['{',...,'}']
			if(words[words.i]!=bracketMap[type])throw Error("unballanced "+type+" brackets");
			block.push(words[words.i]);
			words.i++;
		}
		return block;
	}
	const contexts={
		//simple
			string({index,statement,scope}){//is optional
				let word=statement[index];
				if("\"'`".includes(word[0])){
					let rawString=word
					let includeAllWhiteSpace=word[0]=="`";
					let array=rawString.substr(1,rawString.length-2)
						.replace("\\t","\t")
						.replace("\\n","\n")
						.replace("\\r","\r")
						.replace(/\\u(....)/,(v,v1)=>String.fromCharCode(+"0x"+v1))
						.replace(/\\x(..)/,(v,v1)=>String.fromCharCode(+"0x"+v1))
						.match(/\\[cpX][\s\S]{2}|\\[h]|[\s\S]/g)//color,position,hault
					;
					let string=JSON.parse(rawString
						.replace("\\c","\\x")
						.replace(/\n/g,includeAllWhiteSpace?"\\n":"")
						.replace(/\t/g,includeAllWhiteSpace?"\\t":"")
					);
					index++;
					return {index,value:string,array};
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
		//----
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
			else if(word=="debugger"){
				index++;
				word=statement[index];
				let value;
				if(({value,index}=contexts.string({index,statement,scope})).value!=undefined){
					const str = value;
					const vm=require("vm");
					const sandbox = {log:"no log;",...{index,statement,scope,}};
					vm.createContext(sandbox);
					const code = "log = ["+str+"\n]";
					try{vm.runInContext(code, sandbox);}catch(error){
						console.warn(error);
						throw Error(", Could not run the javascript. threw:{{'"+error+"'}}");
					}
					console.warn("debugger:",...sandbox.log)
				}else{throw Error("expected string in 'debugger' ");}
			}
			if(statement[index]=="{"){
				index++;
				scope.label.code.push(
					(await evalBlock(statement[index++],scope)).label
				);
				index++;
			}
			else{
				assemblyPart:{
					let value;
					if(state.phase=="@")({index,value}=await contexts.main_assembly({statement,index,scope,codeObj}));
					;
					word=statement[index];
					if(word=="#")index++;
					({index,value}=await contexts.main_meta({statement,index,scope,codeObj}));
					;
				}
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
		//main
			async main_meta({statement,index,scope}){//'#' ==> '# let set a;'
				let metaState={
					"let":false,
					"set":false,
					"def":false,
				};
				let word=statement[index];
				let found=false;
				let startValue;//:Value
				while(["let","set","def"].includes(word=statement[index])){
					metaState[word]=true;
					index++;
					found=true;
				}
				if(statement[index]==":")index++;
				if(!found)metaState["set"]=true;
				if(metaState["let"]){
					let value;
					({value,index}=await contexts.expression_short({statement,index,scope}));
					if(value){
						const newLabel=new Variable({name:value.name});
						let labelParent=(value.parent??scope.let).label;
						if(metaState["set"])labelParent.labels[value.name]=newLabel;
						else labelParent.labels[value.name]??=newLabel;
						startValue=new Value({
							type:"label",
							label:newLabel,
							name:newLabel.name,
						});
					}
				}
				let value;
				({index,value}=await contexts.expression({statement,index,scope,startValue,includeBrackets:false}));
				if(metaState["def"]){
					if(value instanceof Value && value.type=="label"){
						contexts.meta_defineLabelToNextLine(value.label,scope);
					}
				}
				return {index};
			},
			meta_defineLabelToNextLine(label,scope){
				//done in the line Assignment phase
				scope.label.code.push(new HiddenLine.Define({label,scope}));
			},
			async main_assembly_arguments({statement,index,scope,instruction}){//'get' 
				//ends at one of: '@$#' or ':;])}'
				for(let i=index;i<statement.length;i++){//returns a list of Value's/strings/numbers 
					if(index>=statement.length)break;
					let word=statement[index];
					if("@$#:;])}".includes(word))break;
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
					else if(word=="["){
						index++;
						let newScope=new Scope({parent:scope});
						newScope.label=new Variable({parent:newScope});
						value=new Value({type:"scope",name:"[",label:newScope});
						instruction.args.push(statement[index]);
						index++;
						continue;
					}
					else{
						instruction.args.push(word);
						continue;
					}
				}
				return{index};
			},
			async main_assembly({statement,index,scope,codeObj}){
				if(!statement[index])return{index};
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
							scope,
						});
						useInstruction=true;
					}
					else if(value.type=="string"){
						codeObj.code.push(...value.string.split("").map(v=>new AssemblyLine({
							type:"data",
							dataType:"char",
							args:[assemblyCompiler.assembly.extraInstructions.string_char,v.charCodeAt(0)],
							scope,
						})));
						useInstruction=false;
					}
					else{
						instruction=new AssemblyLine({
							type:"command",
							args:[value],
							scope,
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
		//----
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
		async parameter(){},
		async argument(){},
		async expression_short({index,statement,scope,shouldEval=true}){//a().b or (1+1)
			if(!statement[index])return{index};
			//shouldEval = true: can cause mutations, false: just needs to return where the expression ends.
			let value,array;
			let word=statement[index];
			if("([".includes(word)){//'(label)'
				({index,value}=await contexts.expression({index,statement,scope,includeBrackets:true,shouldEval}));
			}
			if(word=="{"){
				loga("testing '{'s");throw Error("test");
			}
			else if(({index,value}=await contexts.number({index,statement,scope})).value!=undefined) {
				//'12'
				let number=value;
				if(shouldEval)value=new Value({number,type:"number",bool:!!number});
			}else if(({index,value,array}=await contexts.string({index,statement,scope})).value!=undefined) {
				//'"abc"'
				let string=value;
				if(shouldEval)value=new Value({string,type:"string",array});
			}else if(word.match(nameRegex)){//'label'
				if(shouldEval){
					value=new Value();
					value.name=word;
					value.label=scope.findlabel(value.name);
				}
				index++;
			}
			else{
				//value=new Value();
				return {index,value:undefined};
			}
			for(let i=index;i<statement.length;i++){//'.asd'
				if(index>=statement.length)break;
				let word=statement[index];
				({value,index}=await contexts.extend_value({index,statement,scope,value,shouldEval}));
			}
			return {value,index};
		},
		//expression_short:
			async extend_value({index,statement,scope,value,shouldEval=true}){//.b or [] or ()
				if(value==undefined||value.type=="undefined")value=scope;//'(.b)' == 'b'
				let word=statement[index];
				if([".",".."].includes(word)){// 'a.'
					let parent=value.label;
					value.parent=parent;
					let oldIndex=index;
					if(shouldEval)if(word==".."){//UNFINISHED
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
		async expression({index,statement,scope,startValue=undefined,includeBrackets=true,shouldEval=true}){//a + b
			const operatorRegex=/[+\-*/]/;
			let value=new Value();
			const argsObj=new Variable({code:[]});
			const args=argsObj.code;
			if(startValue !=undefined){
				args.push(startValue);
			}
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
				if(!shouldEval){
					return {index};
				}
			}
			//UNFINISHED
			let nameLast=false;
			for(let i=index;i<statement.length&&index<statement.length;i++){
				let word=statement[index];
				if(["=","=>"].includes(word)){
					let firstArg=args.pop();
					let value;//don't need to do `index++` here
					({value,index}=contexts.expression({statement,index}));
					if(firstArg instanceof Value && firstArg.type=="label"){
						if(word=="="){//evals 'a = b'
							let newLabel;
							//mutation
							if(!value){
								newLabel=undefined;
							}
							else if(value.type=="label"){
								newLabel=value.label;
							}
							else if(value.type=="number"){
								newLabel=new Variable({relAddress:value.number});
							}
							else if(["string","array"].includes(value.type)){
								newLabel=new Variable({code:value.array});
							}
							//let doAssignMent=0||(firstArg.name in firstArg.parent.labels);
							firstArg.parent.labels[firstArg.name]=newLabel;
							args.push(value);
						}
						else if(word=="=>"){
							//UNFINISHED: needs code for array assignment
							args.push(firstArg);
						}
					}
					break;
				}
				if(!nameLast){//not: 'name name'
					if(word.match(nameRegex)||["(","[","{"].includes(word)){
						let value;
						({index,value}=await contexts.expression_short({index,statement,scope,shouldEval}));
						args.push(value);
					}
				}
			}
			value=args[0];
			if(includeBrackets)return {index:nextIndex,value};
			else{
				return {index,value};
			}
		},
	};
	//Operator used here
	function parseExpressionGrouping({statement,index=0},operator=new Operator()){//returns tree:structure
		///@types statement:(string:(operator|label)|Value|Variable)[]
		for(let i=index;i<statement.length&&index<statement.length;i++){
			let word=statement[index];
			index++;
			if("=".includes(word)){//a = b => [b,=,a]
				if(statement[index]=="("){//class function call

				}
				else{
					args=parseExpressionGrouping({statement,index});
				}
			}
		}
	}
	const assemblyCompiler={
		async main(scope){
			const codeQueue=this.collectCode(scope.label);
			const {assemblyCode}=await this.assignMemory(codeQueue,scope.label);
			//(Variable) -> Variable
			const machineCode=this.compileAssembly(assemblyCode);//(Variable) -> MachineCode
			return machineCode;
		},
		//$ phase
			//code collection and memory assignment
			collectCode(variable,codeQueue){//collects assembly code
				"use strict";
				let code=variable.code;
				codeQueue??=[];
				for(const lineObj of code){//lineObj instanceof AssemblyLine
					if(
						lineObj instanceof HiddenLine||
						lineObj instanceof AssemblyLine
					){
						codeQueue.push(lineObj);
					}else if(lineObj instanceof Variable){
						this.collectCode(lineObj,codeQueue)
					}
				}
				return codeQueue;
			},
			async assignMemory(codeQueue,codeObj){
				"use strict";
				if(!codeObj instanceof Array)throw Error("compiler error: 'codeQueue' is not a normal Array.");
				const code=codeObj.code;
				const assemblyCode=new Variable();
				let lineNumber=codeObj.address??0;
				//task managing 
				let queue={//circular queue
					maxLen:codeQueue.length,
					size:codeQueue.length,
					list:codeQueue,
					tail:0,head:0,
					enqueue(item){
						if(this.size++==this.maxLen)throw Error("compiler error: queue overflow");
						this.list[this.head++]=item;
						this.head%=this.maxLen;
					},
					dequeue(){
						if(this.size--==0)throw Error("compiler error: queue underflow");
						const item=this.list[this.tail++];
						this.tail%=this.maxLen;
						return item;
					},
				};
				for(let i=0;i<queue.maxLen&&queue.size>0;i++){//lineObj instanceof CodeLine || lineObj instanceof Variable 
					let oldLen=queue.size;
					for(let i=0;i<oldLen&&i<queue.size;i++){
						const lineObj=queue.dequeue();
						let failed;
						if(lineObj instanceof CodeLine){
							lineObj.cpuState=new CpuState({lineNumber,});
						}
						if(lineObj instanceof HiddenLine){
							({lineNumber,failed}=await assemblyCompiler.evalHiddenLine({lineObj,lineNumber,assemblyCode,codeObj}));
						}else if(lineObj instanceof AssemblyLine){
							let {machineCode,failed}=assemblyCompiler.compileAssemblyLine({lineObj,assemblyCode,lineNumber});
							assemblyCode.code[lineNumber++]=machineCode;
						}else throw Error("compiler error: type error: lineObj");
						if(failed){
							queue.enqueue(lineObj);
						}
					}
					if(queue.size>=oldLen){
						throw Error
						("0xmin error: $ phase: uncomputable code. lens:"+oldLen+"->"+codeQueue.length);
					}
				}
				return {lineNumber,assemblyCode};
			},
			//assembly compiling
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
			async evalHiddenLine({lineObj,lineNumber,assemblyCode,codeObj}){//shouldEval's $ or # code in the '$' phase
				//UNFINISHED
				let code=lineObj;
				let failed;
				({lineNumber,faled}=code.run({lineNumber,}));
				return {lineNumber,failed};
			},
		//----
		//@ phase : (binary phase)
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
						arg=arg.label.lineNumber;
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
		//includes '= (' '+ =' '- ='
		class Operator extends Array{
			operator;
			type;//for special operator types e.g. '+=' or '=('
			constructor(word){
				this.operator=word;
			}
		}
		///@abstract
		class DataClass{
			//constructs data class
			con(data){
				"use strict";
				Object.assign(this,data);
				Object.seal(this,data);
			}
			//constructor(data){Object.assign(this,data??{})}
		}
		class Brackets extends Array{

		}
		class Value extends DataClass{
			constructor(data){super();Object.assign(this,data??{})}
			fromLabel(label){//UNUSED
				this.label=label;
				this.type="label";
				this.number=label.lineNumber;
				this.array=[...label.code];
			}
			parent;//'parent.name' ==> label
			refType;//'a.b','a[b]','set a {b}';
			label;//label Object
			name;//label name (from parent.labels)
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
		class CpuState extends DataClass{
			constructor(data){super();Object.assign(this,data??{})}
			jump;//:int ; line pointer
			move;//:int ; data pointer
			lineNumber;//:int
		}
		///@abstract
		class CodeLine extends DataClass{//assembly line of code
			//constructor(data){super();Object.assign(this,data??{})}
			cpuState;//:CpuState
			scope;
		}
		class AssemblyLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
			//binaryValue is the final value of this line of code.
			//also used in meta (#) phase represent the value.
			type="number";///number,string,command
			args=[];///Value[];
			binaryValue=undefined;
			dataType=undefined;//optional used with e.g.'String.char(5)' in '"text";'
			command;
			data;
		}
		;
		///@abstract
		class HiddenLine extends CodeLine{
			//contains
			run({lineNumber,scope,cpuState}){return {lineNumber,failed:false};}
			static Define=class extends HiddenLine{//'$def a;'
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				run({lineNumber:nextLineNumber}){
					this.label.lineNumber=nextLineNumber;
					return{lineNumber:nextLineNumber,failed:false};
				}
			}
			static RelocateCurrentLineNumber=class extends HiddenLine{//'$ram 10;'
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				run({lineNumber:nextLineNumber}){
					nextLineNumber=this.label.lineNumber;
					return{lineNumber:nextLineNumber,failed:false};
				}
			}
		}
		class MetaLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
		}
		;
		class Variable extends DataClass{// codeObj/label
			constructor(data){super();Object.assign(this,data??{})}
			//as value
			type="label";
			//as object
			name=undefined;///@string
			labels={};//aka properties
			prototype=null;///instanceof Variable
			supertype=null;///instanceof Variable
			//as function
			code=[];//:array of CodeLines lines
			parameters={};
			scope=null;//the scope that the code should be called with.
			//assembly
			relAddress=0;//number
			//defineLine=null;//instanceof AssemblyLine
			lineNumber=undefined;
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
				if(name in this.label?.labels)return this.label;
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
	//'{' ==> '{ ... }'
	async function evalBlock(block,parentScope=undefined,scope=undefined){
		//does not include brackets
		const includeBrackets=false;
		if(includeBrackets)throw Error("compiler error: not evalBlock does not support including brackets");
		if(!scope){
			scope=new Scope({parent:parentScope});
			scope.parent=scope;
			scope.let=scope;
			scope.var=scope;
			scope.label=new Variable();
		}
		for(let i=0;i<block.length;i++){
			const statement=block[i];
			await contexts.main({statement,scope});
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
	const outputAsString=()=>outputFile.map(v=>v.toString(16)).map(v=>"0".repeat(8-v.length)+v);
	loga("len("+outputFile.length+"):",""+outputAsString());
	return outputBinary;
};
let buildSettings={makeFile:true}
{
	//possible names: 
	//  0xmin Assembly Small Macro language or (ZASM)
	//  0xmin @ssembly $mall #acro language or (0@$#)
	//compilation phases:
	//meta
	//memory/lineNumber assignment + CPU state emulating
	//assembly compiling
	//checks for logic errors due to the CPU's state.
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