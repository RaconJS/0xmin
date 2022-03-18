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
	const stringRegex=/^["'`]/;
	const openBracketRegex=/^[(\[{]/;
	const endingStringList="@$#:;])}";
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
		"{":({"{ }":class extends Array{recur;maxRecur;}})["{ }"],
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
			let newScope=new Scope({label:codeObj,parent:scope,code:statement});
			codeObj.scope=newScope;
			let state={void:false,static:false,phase:"@"};
			statement.maxRecur;
			statement.recur??=0;
			statement.recur++;
			let word=statement[index];let asd=2;
			if(index>=statement.length)return{index,value:newScope};
			if(statement.recur<=(statement.maxRecur??1))
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
					let maxRecur=await calcReps();
					if(statement.maxRecur==undefined||maxRecur<statement.maxRecur){
						statement.maxRecur=maxRecur;
					}
					if(statement[index]==":")index++;
					return await contexts.main({statement,index,scope});
				}
			}
			else if(["debugger","import","delete"].includes(word)){
				if(word=="debugger"){//debugger name "label";
					index++;
					word=statement[index];
					let inputValue;
					let value;
					if(!word.match(stringRegex)){//'debugger' =>  'debugger name' optional argument;
						let value;
						({value,index}=await contexts.expression_short({index,statement,scope}));
						if(value)inputValue=value;
						word=statement[index];
					}
					if(({value,index}=contexts.string({index,statement,scope})).value!=undefined){
						const str = value;
						const vm=require("vm");
						const sandbox = {log:"no log;",...{index,statement,scope,value:inputValue,label:inputValue?.label}};
						vm.createContext(sandbox);
						const code = "log = ["+str+"\n]";
						try{vm.runInContext(code, sandbox);}catch(error){
							console.warn(error);
							throw Error(", Could not run the javascript. threw:{{'"+error+"'}}");
						}
						console.warn("debugger:",...sandbox.log)
					}else{throw Error("expected string in 'debugger' ");}
				}
				else if(word=="delete"){
					index++;
					for(let i=0;i<statement.length&&index<statement.length;i++){
						let value;
						({value,index}=await contexts.expression_short({index,statement,scope}));
						if(value){
							if(value.parent&&value.label&&value.type=="label"){
								delete value.parent.labels[value.name];
							}
						}else break;
						if(!word==","){//delete a,b,c ;
							break;
						}
					}
				}
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
					else if(state.phase=="$")({index,value}=await contexts.main_hidden({statement,index,scope,codeObj}));
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
				for(let i=0;i<statement.length;i++){//'#let a,b,c;'
					let foundExpression=false;
					let word;
					if(metaState["let"]){
						let value;
						({value,index}=await contexts.expression_short({statement,index,scope}));
						if(value){
							foundExpression=true;
							const newLabel=new Variable({name:value.name});
							let labelParent=(value.parent??scope.let.label);
							if(metaState["set"])labelParent.labels[value.name]=newLabel;
							else labelParent.labels[value.name]??=newLabel;
							startValue=new Value({
								type:"label",
								label:newLabel,
								name:newLabel.name,
								parent:labelParent,
							});
						}
					}
					let value;
					({index,value}=await contexts.expression({statement,index,scope,startValue,includeBrackets:false}));
					foundExpression||=!!value;
					if(metaState["def"]){
						if(value instanceof Value && value.type=="label"){
							contexts.meta_defineLabelToNextLine(value.label,scope,value);
							scope.label.code.push(value.label);
						}
					}
					word=statement[index];
					if(word==",")index++;
				}
				return {index};
			},
			async main_hidden({statement,index,scope,instruction}){

				return{index};
			}
			meta_defineLabelToNextLine(label,scope,value){
				//done in the line Assignment phase
				if(label==undefined)throw Error("0xmin error: label '"+value.name+"' is not defined");
				scope.label.code.push(new HiddenLine.Define({label,scope}));
			},
			async main_assembly_argument({statement,index,scope,instruction}){
				///@mutates: instruction,index;
				let word=statement[index];
				let value;
				if(({index,value}=contexts.number({index,statement})).value!=undefined){//'2'
					instruction.args.push(value);
				}
				else if(word.match(nameRegex)){//'command' or 'label'
					let value;
					({value,index}=await contexts.expression_short({statement,index,scope,includeBrackets:false}));
					instruction.args.push(value);
				}
				else if(["("].includes(word)){
					let value;
					({value,index}=await contexts.expression_short({statement,index,scope,includeBrackets:true}));
					instruction.args.push(value);
				}
				else if(["->","<-"].includes(word)){
					index++;
					let operator=new Operator(word);
					({index}=await contexts.main_assembly_argument({statement,index,scope,instruction}));
					operator.push(instruction.args.pop());
					instruction.args.push(operator);
					//'[a, -> [], b]' => '[a, -> [b]]'
				}
				else if(word=="["){
					index++;
					let newScope=new Scope({parent:scope,code:statement[index]});
					newScope.label=new Variable({scope:newScope});
					value=new Value({type:"scope",name:"[",label:newScope});
					instruction.args.push(value);
					index++;
				}
				else{
					instruction.args.push(word);
				}
				return{index};
			},
			async main_assembly_arguments({statement,index,scope,instruction}){//'get' 
				//ends at one of: '@$#' or ':;])}'
				for(let i=index;i<statement.length;i++){//returns a list of Value's/strings/numbers 
					let word=statement[index];
					if(index>=statement.length)break;
					if("@$#:;])}".includes(word))break;
					({index}=await contexts.main_assembly_argument({statement,index,scope,instruction}));
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
					;
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
					else if(value.type=="array"){
						if(value.label)codeObj.code.push(value.label);
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
			if(word=="("&&(
				statement[index+3]=="{"||
				["=>","=","->"].includes(statement[index+3])&&statement[index+4]=="{"
			)){//function
				;
			}
			else if("([".includes(word)){//'(label)'
				({index,value}=await contexts.expression({index,statement,scope,includeBrackets:true,shouldEval}));
			}
			else if(word=="{"){
				index++;
				//makes block scope
				let newScope=await evalBlock(statement[index],scope);
				let label=newScope.label;
				index++;
				value=new Value({type:"label",label});
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
					let {label,parent}=scope.findLabel(value.name)??{};
					value.label=label;
					value.parent=parent;
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
					return {index,value};
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
					index++;
					let firstArg=args.pop();
					let assignmentType;
					if(firstArg instanceof Operator){
						assignmentType=firstArg;
						firstArg=args.pop();
						if(!(firstArg instanceof Value))throw Error("0xmin type error:"+
							" not allowed to assign an expression to an operator e.g. '+ += 2' is not allowed."
						);
					}
					let value;//don't need to do `index++` here
					({value,index}=await contexts.expression({statement,index,scope,includeBrackets:false}));
					if(firstArg instanceof Value && firstArg.type=="label"){
						if(assignmentType==undefined&&word=="="){//evals 'a = b'
							//let doAssignMent=0||(firstArg.name in firstArg.parent.labels);
							let newLabel;{
								//mutation
								if(!value){
									newLabel=undefined;
								}
								else if(value.type=="label"){
									newLabel=value.label;
								}
								else if(value.type=="number"){
									newLabel=new Variable({type:"number",name:value.number,relAddress:value.number,lineNumber:value.number});
								}
								else if(["string","array"].includes(value.type)){
									newLabel=new Variable({code:value.array});
								}
							}
							if(firstArg.type=="label"&&firstArg.parent){
								//overwrites variable 'a.b=2;' or 'a=2;'
								firstArg.parent.labels[firstArg.name]=newLabel;
								value=newLabel;
							}else{
								//sets properties of existing variable
								if(firstArg.type=="label"){
									value.label=newLabel;
								}
								else{
								}
							}
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
			const {assemblyCode}=await this.assignMemory(codeQueue,scope);
			//(Variable) -> Variable
			const machineCode=await this.compileAssembly(assemblyCode);//(Variable) -> MachineCode
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
			/*async assignMemory(codeQueue,codeObj){
				"use strict";
				if(!codeObj instanceof Array)throw Error("compiler error: 'codeQueue' is not a normal Array.");
				const code=codeObj.code;
				const assemblyCode=new Variable();
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
					getNextItem(){
						const item=this.list[this.tail++];
						this.tail%=this.maxLen;
						return item;
					},
					dequeue(){
						if(this.size--==0)throw Error("compiler error: queue underflow");
						const item=this.list[this.tail++];
						this.tail%=this.maxLen;
						return item;
					},
				};
				let stateUpdated=true;
				for(let i=0;i<queue.maxLen&&queue.size>0;i++){//lineObj instanceof CodeLine || lineObj instanceof Variable 
					let oldLen=queue.size;
					let fails=0;
					let lineNumber=codeObj.address??0;
					const cpuState=new CpuState();
					for(let i=0;i<oldLen&&i<queue.size;i++){
						const lineObj=queue.getNextItem();//queue.dequeue();
						let failed;
						if(lineObj instanceof CodeLine){
							if(lineObj.cpuState)Object.assign(cpuState,lineObj.cpuState)
							else lineObj.cpuState=new CpuState(cpuState);
						}
						if(lineObj instanceof HiddenLine){
							({failed,stateUpdated}=await assemblyCompiler.evalHiddenLine({lineObj,cpuState,assemblyCode,codeObj,stateUpdated}));
						}else if(lineObj instanceof AssemblyLine){
							if(stateUpdated){
								assemblyCode.cpuState=cpuState;
								stateUpdated=false;loga("?",)
							}
							assemblyCode.code[lineNumber++]=lineObj;
							cpuState.jump++;
						}else throw Error("compiler error: type error: lineObj");
						if(failed){fails++
							lineObj.cpuState=null;
							//queue.enqueue(lineObj);
						}
					}
					if(queue.size>oldLen&&fails>=queue.size){
						throw Error
						("0xmin error: $ phase: uncomputable code. lens:"+oldLen+"->"+codeQueue.length);
					}
				}
				return {lineNumber,assemblyCode};
			},*/
			async assignMemory(codeQueue,scope){
				"use strict";
				if(!(codeQueue instanceof Array))throw Error("compiler type error: 'codeQueue' is not a normal Array.");
				if(!(scope instanceof Scope))throw Error("compiler type error");
				let lastFails=codeQueue.length;
				let startingCpuState=new CpuState();
				let cpuState=new CpuState();
				const assemblyCode=new MachineCode()
				for(let i=0;i<codeQueue.length;i++){
					let fails=0;
					cpuState.setValues(startingCpuState);
					for(let i=0;i<codeQueue.length;i++){
						const instruction=codeQueue[i];
						let failed=false;
						if(instruction instanceof HiddenLine){
							///@mutates: cpuState,scope;
							({failed}=await this.evalHiddenLine({instruction,cpuState,code:codeQueue,scope,assemblyCode}));
						}
						else if(instruction instanceof AssemblyLine){
							assemblyCode.code[cpuState.lineNumber]=instruction;
							instruction.cpuState=new CpuState(cpuState);
							///@mutates: instruction,cpuState;
							({failed}=await this.compileAssemblyLine({instruction,assemblyCode,cpuState,code:codeQueue}));
						}
						if(failed){
							fails++;
						}
					}
					if(fails==0)break;
					if(fails>=lastFails)throw Error("0xmin error: possibly uncomputable;");
					lastFails=fails;
				}
				for(let i=0;i<assemblyCode.code.length;i++){
					assemblyCode.code[i]??=this.nullValue;
				}
				return {assemblyCode};
			},
			//assembly compiling
			async compileAssemblyLine({instruction,cpuState,assemblyCode}){
				Object.getPrototypeOf;
				if(!(instruction instanceof AssemblyLine))throw Error("compiler error: type error;");
				//const cpuState=instruction.cpuState;
				if(!(cpuState instanceof CpuState))throw Error("compiler error: type error;");
				const machineCode=instruction;//=new AssemblyLine(instruction);
				let failed=false;
				{
					let arg=instruction.args[0];
					let binaryValue=0;
					//const cpuState=instruction.cpuState;
					for(let i=0;i<instruction.args.length;i++){
						arg=instruction.args[i];
						({arg,failed}=await this.decodeArgument(instruction.args,i,cpuState));
						failed||=isNaN(arg)&&!arg==undefined;//undefined or null are allowed to pass
						if(failed)break;
						let binaryArg;
						if(typeof arg=="number"){
							if(i==1&&instruction.type=="command"&&this.assembly.language=="0xmin"){
								//compile address; handles 0xmin quirks
								binaryArg=arg<0?(((2*(arg&1)-arg)&0xff)*0x10)|0x1000:(arg&0xff)*0x10;
								binaryValue|=binaryArg;
							}
							else switch(instruction.type){
								case"data":binaryValue|=binaryArg=arg;break;
								case"command":binaryValue|=binaryArg=
									(arg&((1<<this.assembly.machineCodeArgs[i][1])-1))
									<<this.assembly.machineCodeArgs[i][0];break;
							}
							continue;
						}
						if(!arg){
							binaryValue=this.nullValue.binaryValue; 
						}
					}
					if(this.assembly.language=="0xmin"){
						cpuState.lineNumber++;
						cpuState.jump++;
					}
					machineCode.binaryValue=binaryValue;
				}
				return {failed};
			},
			async evalHiddenLine({instruction,cpuState,assemblyCode}){//shouldEval's $ or # code in the '$' phase
				//UNFINISHED
				let failed;
				({lineNumber,faled}=instruction.run({cpuState,}));
				return {lineNumber,failed};
			},
		//----
		//@ phase : (binary phase)
			assembly:{//0xmin assembly language
				language:"0xmin",
				instructionSet:{
					"move":0,
					"jump":1,
					"nor":2,
					"red":3,
					"blue":4,
					"set":5,
					//
					"get":5,
					"set":10,
					"if":11,
					"xor":6,
					"and":7,
					"or":8,
				},
				init(){
					let name;
					this.pointers[name="jump"]=new Pointer(name,0);
					this.pointers[name="move"]=new Pointer(name,0);
				},
				pointers:{},
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
					[13,17],
				],//[starting bit number,length of argument (in bits)]
			},
			nullValue:null,//will be defined later
			findPointerOrLabel(value,cpuState){//:Pointer|Variable
				/// value:number|Value
				if(typeof value=="number")return new Variable({lineNumber:value});
				if(!(value instanceof Value&&value.type=="label"))throw Error("compiler type error:");
				
				return (this.assembly.pointers[value.name]?.getState?.(cpuState)??value.label);
			},
			async decodeArgument(args,argNumber=0,cpuState,type="command"){
				let arg=args[argNumber];
				let failed=false;
				if(arg instanceof bracketClassMap["("]){//code tree
					let {value,index}=await contexts.expression({index:0,statement:arg});
					arg=value;
				}
				if(arg instanceof Operator){
					if(["->","<-"].includes(arg.operator)){
						let fromArg,toArg;
						toArg=this.findPointerOrLabel(arg[0],cpuState);
						fromArg=this.findPointerOrLabel(args[argNumber-1],cpuState);
						if(toArg==undefined||fromArg==undefined)throw Error("0xmin error: labels in 'a->b' are undefined. try 'let a,b;'");
						if(arg.operator=="<-"){
							let carry=toArg;
							toArg=fromArg;
							fromArg=carry;
						}
						arg=toArg.lineNumber-fromArg.lineNumber;
						failed=isNaN(+arg);
						if(fromArg.type=="pointer"){
							if(this.assembly.language=="0xmin"){
								if(fromArg.name=="move"){
									cpuState.move=toArg.lineNumber;
								}
							}
						}
					}
				}
				else if(arg instanceof Value){
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
				return {arg,failed};//:number
			},
			async compileAssembly(machineCode){//ordered assembly code
				for(let i=0;i<machineCode.code.length;i++){
					const instruction=machineCode.code[i];
					if(!instruction){
						machineCode.code[i]=this.nullValue;
					}
				}
				return machineCode;
			},
		//----
	};
	//classes
		///@abstract
		//includes '= (' '+ =' '- ='
		class Operator extends Array{
			operator;//:string ;
			type;//:string ; for special operator types e.g. '+=' or '=('
			constructor(word){
				super();
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
			type="label";//label|number|array|string; label == array == function
			bool=false;
			number=0;//relAddress
			array=[];//code
			static Number=class extends Value{constructor(number){super({number,type:"number"})}}
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
			nextLine(){
				if(assemblyCompiler.assembly.language=="0xmin"){
					this.jump++;
				}
				this.lineNumber++;
			}
			setValues(newCpuState){
				Object.assign(this,newCpuState);
			}
			jump=0;//:int ; line pointer
			move=0;//:int ; data pointer
			lineNumber=0;//:int
		}
		///@abstract
		class CodeLine extends DataClass{//assembly line of code
			//constructor(data){super();Object.assign(this,data??{})}
			cpuState=null;//:CpuState|null
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
				run({cpuState}){//nextlineNumber
					this.label.lineNumber=cpuState.lineNumber;
					return{failed:false};
				}
			}
			static RelocateCurrentLineNumber=class extends HiddenLine{//'$ram 10;'
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				run({cpuState}){
					cpuState.lineNumber=this.label.lineNumber;
					return{failed:false};
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
			parameters={};
			scope=null;//the scope that the code should be called with. the scope contains the code
			code=[];//:array of CodeLines lines
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
					this.supertype?.findLabel?.(name)
					??{label:this.labels[name],parent:this}
					??this.prototype?.findLabel?.(name)
				;
			}
		}
		class Pointer extends Variable{
			constructor(name,lineNumber){
				super({name,lineNumber});
			}
			getState(cpuState){
				if(!(cpuState instanceof CpuState))throw Error("compiler type error");
				this.lineNumber=cpuState[this.name];
				
				return new Variable(this);
			}
			type="pointer";
			//name;
			//lineNumber;
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
				if(!(this.code instanceof Array))throw Error("compiler type error: Scope class requires `this.code` to be a source code tree;");
			}
			label=null;//label that owns this scope, label contains properties.
			//scopes
				parent=null;
				var=null;
				let=null;
			//----
			isSearched=false;
			code;//: bracketClassMap["{"];
			findLabel(name){
				const parent=this.findLabelParent(name);
				if(parent)return {parent,label:parent.labels[name]}
				else return;
			}
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
		class GlobalScope extends Scope{
			label=new Variable({scope:this});
			parent=this;
			let=this;
			var=this;
		}
		class BlockScope extends Scope{
			label=new Variable({scope:this});
			let=this;
		}
	//----
	{
		assemblyCompiler.nullValue=new AssemblyLine({
			type:"undefined",
			args:[0],
			binaryValue:0,
		});
		assemblyCompiler.assembly.init();
	}
	//'{' ==> '{ ... }'
	async function evalBlock(block,parentScope=undefined,scope=undefined){
		//does not include brackets
		const includeBrackets=false;
		if(includeBrackets)throw Error("compiler error: not evalBlock does not support including brackets");
		if(!scope){
			if(!parentScope){
				scope=new GlobalScope({code:block});
			}else{
				scope=new BlockScope({parent:parentScope,code:block});
			}
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