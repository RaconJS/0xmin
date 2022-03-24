//node.js version 16
//BODGED
//UNFINISHED
//NEEDSTESTING
//TESTING
//TODO
//UNUSED
//DONE: operators in expression e.g. 'a + b'
//TODO: 'a..length' internal properties
//DONE: add 'virtual' keyword in 'recur/repeat/virtual'. for structs e.g. 'virtual {};' or 'virtual obj;' compiles 'obj' relative to 'obj'
+process.version.match(/[0-9]+/g)[0]>=16;
try {1??{}?.(2)}catch(e){throw Error("This 0xmin compiler requires node.js version 16.")}
function loga(...args){console.log(...args);};
//extra foos
	//tabify object
	const tabs=(obj,b=0)=>JSON.stringify(obj)
		.replace(/([{},])/g,(n,v1)=>{
			if(v1=="{")return v1+"\n"+"\t".repeat(++b);
			if(v1=="}")return "\n"+"\t".repeat(--b)+v1;
			if(v1==",")return v1+"\n"+"\t".repeat(b);
		})
		.replace(/({)\s+(})\s*(,)?/g,(n,v1,v2,v3)=>v1+v2+v3)
	;
	Object.doubleFreeze=(obj)=>{
		for(let i in obj)if(typeof obj[i]=="object"&&obj[i])Object.freeze(obj[i]);
		Object.freeze(obj);
	};
//----
const oxminCompiler=async function(inputFile,fileName){
	"compiler error: type error;";
	//string consts
		const wordsRegex=//does not include: /\s+/
		/\/\/[\s\S]*?(?:\n|$)|\/\*[\s\S]*?\*\/|(["'`])(?:\1|[\s\S]*?[^\\]\1)|\b0x(?:[0-9]|[a-f]|[A-F])+\b|0b[01]+|[1-9][0-9]+|[\w_]+|[=-]>|::|\.{1,3}|[&|\^]{1,2}|={1,3}|>{1,3}|<{1,2}|[!\$%*()-+=\[\]{};:@#~\\|,/?]/g
		;
		const nameRegex=/^[\w_]/;
		const stringRegex=/^["'`]/;
		const openBracketRegex=/^[(\[{]/;
		const endingStringList="@$#:;])}";
		const functionCallTypes=["=>", "=", "->"];
	//----
	//inputFile -> code tree
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
	//----
	//extra classes
		class Operator_numeric{
			//numOfArgs: 1|2;
			///operation: () => number;
			constructor(operation_2Args,leftArgOnly,rightArgOnly){//(a+b,a+,+b)
				if(leftArgOnly)throw Error("compiler error: operator form: 'a +' is not supported");
				this.operation=operation_2Args;
				this.leftArgOnly=leftArgOnly;
				this.rightArgOnly=rightArgOnly;
			}
			do({args,hasEquals}){
				///ans:number;
				let ans,arg0=args.pop(),arg1,fistArg;
				let do1Arg=true;//true=> does 1 arguments operation instead.
				if(args.length>0&&this.operation_2Args){
					arg1=args.pop();
					if(arg1 instanceof Value){
						ans=this.operation_2Args((fistArg=arg1).toNumber().number,arg0.toNumber().number);
						do1Arg=false;
						if(hasEquals){if(fistArg.type=="label"&&fistArg.parent&&fistArg.parent.labels[fistArg.name]){
							fistArg.label.lineNumber=ans;
							fistArg.parent.labels[fistArg.name]=Variable.fromValue(fistArg);
							args.push(fistArg);
						}}
						else args.push(new Value.Number(ans));
					}
				}
				if(do1Arg){
					if(this.rightArgOnly)ans=this.operation(arg0.toNumber().number);
					else if(this.leftArgOnly)ans=this.operation(arg0.toNumber().number);
					args.push(new Value.Number(ans));
				}
			}
		};
	//----
	const contexts={
		//simple
			string({index,statement,scope}){//is optional
				let word=statement[index];
				if("\"'`".includes(word[0])){
					let rawString=word
					let includeAllWhiteSpace=word[0]=="`";
					let array=rawString.substr(1,rawString.length-2)
						.replace("\\t", "\t")
						.replace("\\n", "\n")
						.replace("\\r", "\r")
						.replace(/\\u(....)/,(v,v1)=>String.fromCharCode(+"0x"+v1))
						.replace(/\\x(..)/,(v,v1)=>String.fromCharCode(+"0x"+v1))
						.match(/\\[cpX][\s\S]{2}|\\[h]|[\s\S]/g)//color,position,hault
					;
					let string=JSON.parse(rawString
						.replace("\\c", "\\x")
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
			let codeObj=new Variable({name:"(code line)",type:"array"});
			let newScope=new Scope({label:codeObj,parent:scope,code:statement});
			codeObj.scope=newScope;
			let state={void:false,static:false,virtual:false,phase:""};
			statement.maxRecur;
			statement.recur??=0;
			statement.recur++;
			let word=statement[index];let asd=2;
			if(index>=statement.length)return{index,value:newScope};
			if(statement.recur<=(statement.maxRecur??1))
			if(["void", "static", "virtual", "#", "$", "@"].includes(word))
			loop:for(let i=index;i<statement.length;i++){
				let word=statement[index];
				({index}=contexts.phaseSetter({index,statement,scope,state}));
				switch(word){
					case"void":{
						state.void="void";index++;
					}break;
					case"static":{
						state.phase="void";index++;
					}break;
					case"virtual":{
						state.virtual=true;index++;
					}case":":{index++;
						break loop;
					}break;
					default:{
						break loop;
					}
				}
			}
			if(["repeat", "recur"].includes(word)){//repeat 10: recur 10:
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
			else if(["debugger", "import", "delete", "..."].includes(word)){
				if(word=="debugger"){//debugger name "label";
					({index}=evalDebugger({index,statement,scope}));
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
				else if(word=="..."){
					({index}=await contexts.main_injectCode({index,statement,scope}));
				}
			}
			if(state.virtual)newScope.label.code.push(virtualLine=new HiddenLine.Virtual());
			if(statement[index]=="{"){
				index++;
				newScope.label.code.push(
					(await evalBlock(statement[index++],scope)).label
				);
				index++;
			}
			else{assemblyPart:{
					let value,virtualLine;
					if(state.phase==""){//auto detect phase
						word=statement[index];
						if(["let", "set"].includes(word))
							state.phase="#";
						else if(word&&(["def", "ram"].includes(word)||word[0].match(/[a-zA-Z_]/)&&!(word in assemblyCompiler.assembly.instructionSet)))
							state.phase="$";
						else state.phase="@";
					}
					if(state.phase=="@")({index,value}=await contexts.main_assembly({statement,index,scope:newScope}));
					else if(state.phase=="$")({index,value}=await contexts.main_hidden({statement,index,scope:newScope}));
					word=statement[index];
					if(word=="#"){
						state.phase="#"
						index++;
					}
					if(state.phase=="#")({index,value}=await contexts.main_meta({statement,index,scope:newScope}));
					;
				}
			}
			if(state.virtual)newScope.label.code.push(new HiddenLine.Void(virtualLine));
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
			phaseSetter({statement,index,scope,state}){
				///state : {phase:string;}
				let word=statement[index];
				if("#$@".includes(word)){
					state.phase=word;
					index++;
				}
				return{index};
			},
			keyWordList({statement,index,scope,keywords}){//'let set:'
				//keywords: interface{[key:string]:false}
				let word,found=false;
				//["let", "set", "def"]
				while((word=statement[index]) in keywords){
					keywords[word]=true;
					index++;
					found=true;
				}
				if(statement[index]==":")index++;
				return {index,found,keywords};
			},
			async main_meta({statement,index,scope}){//'#' ==> '# let set a;'
				const metaState={
					"let":false,
					"set":false,
					"def":false,
				};
				let found;
				({index,found}=contexts.keyWordList({statement,index,scope,keywords:metaState}));
				let word=statement[index];
				let startValue;//:Value
				if(!found)metaState["set"]=true;
				for(let i=0;i<statement.length&&index<statement.length;i++){//'#let a,b,c;'
					let foundExpression=false;
					let word;
					word=statement[index];
					if(endingStringList.includes(word)){break;}
					if(metaState["let"]){
						let value;
						({value,index}=await contexts.expression_short({statement,index,scope,isLet:true}));
						if(value){
							foundExpression=true;
							const newLabel=new Variable({name:value.name,...(value.isExtendedByBlock?value.label:{})});
							let labelParent=(value.parent??scope.let.label);
							if(metaState["set"]){
								labelParent.labels[value.name]??=newLabel;
							}else{
								labelParent.labels[value.name]=newLabel;
							}
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
						if(value instanceof Value && value.type=="label"){//for '@null $def: label'
							contexts.meta_defineLabelToNextLine(value.label,scope,value,true);
							scope.label.code.push(value.label);
						}
					}
					word=statement[index];
					if(word==",")index++;
				}
				return {index};
			},
			labelToRelLabel({statement,index,scope,value}){//'label' ==> 'label+10'
				//relative label
				let word=statement[index];
				if(!(value instanceof Value))throw Error("compiler type error");
				if(value.type=="label"){
					let sign=0;
					if("+-".includes(word)){//'$jump->label+10'; UNUSED
						index++;
						sign=+("-"==word);
					}
					let number;
					({value:number,index}=contexts.number({statement,index,scope}));
					value.number=number*[1,-1][sign]??0;
				}
				return {index};
			},
			async main_hidden({statement,index,scope}){
				let value;
				let word;
				const state={"def":false,"set":false,"debugger":false};
				let found;
				({index,found}=contexts.keyWordList({index,statement,scope,keywords:state}));
				if(state["debugger"]){
					scope.label.code.push(new HiddenLine.Debugger({index,statement,scope}));
					index=statement.length;
					return {index};
				}
				({value,index}=await contexts.expression_short({statement,index,scope}));
				word=statement[index];
				if(!found){
					state["set"]=true;
					state["def"]=true;
				}
				if(state["def"]){//'$def labelA;' or '$def labelA->labelB' ==> sets label address
					if(["->", "<-", "=>", "<="].includes(word)){
						index++;
						let isReversed=word[0]=="<"?1:0;
						let operator=new Operator(word.match(/[\-=]/)[0]+">");
						operator[isReversed]=value;
						({value,index}=await contexts.expression_short({statement,index,scope}));
						operator[1-isReversed]=value;
						({index}=contexts.labelToRelLabel({statement,index,scope,value}));
						let newLine=new HiddenLine.SetLabelOrPointer({operator});
						scope.label.code.push(newLine);
					}else{
						contexts.meta_defineLabelToNextLine(value.label,scope,value);
						if(value.label)value.label.defs.push(scope.label);
					}
				}
				if(state["set"]){//'$set label;' => inserts contence of label
					scope.label.code.push(value.label);
					if(value.label)value.label.defs.push(scope.label);
				}
				return{index};
			},
			meta_defineLabelToNextLine(label,scope,value,useUnshift=false){
				//done in the line Assignment phase
				if(label==undefined)throw Error("0xmin error: label '"+value.name+"' is not defined");
				let newLineObj=new HiddenLine.Define({label,scope});
				if(useUnshift)scope.label.code.unshift(newLineObj);
				else scope.label.code.push(newLineObj);
			},
			async main_assembly_argument({statement,index,scope,instruction}){
				///@mutates: instruction,index;
				let word=statement[index];
				let value;
				if(({index,value}=contexts.number({index,statement})).value!=undefined){//'2'
					instruction.args.push(new Value.Number(value));
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
				else if(["->", "<-", "=>", "<="].includes(word)){
					index++;
					({index}=await contexts.main_assembly_argument({statement,index,scope,instruction}));
					let operator=new Operator(word,[instruction.args[instruction.args.length-2],instruction.args.pop()]);
					const hiddenLine=new HiddenLine.SetLabelOrPointer({operator});
					instruction.args.push(hiddenLine);
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
			async main_assembly({statement,index,scope}){
				({index}=contexts.keyWordList({statement,index,scope,keywords:{}}));//'@: 123;' or '@ 123;'
				const codeObj=scope.label;
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
						codeObj.code.push(Variable.fromValue(value));
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
			let failed=false;
			if(statement[index]=="..."){
				let value;
				index++;
				({index,value}=await contexts.expression_short({statement,index,scope}));
				scope.code.push(...(Variable.fromValue(value)?.code??[]));
			}else failed=true;
			return{index,failed};
		},
		async main_injectCode({statement,index,scope}){
			if(statement[index]!="...")return{index,failed:true};
			index++;
			//'...let: obj;' ==> insert properties of object
			//'...set: obj;' ==> insert code of block
			//'...def: foo;' ==> run code source in scope
			const state={"let":false,"set":false,"def":false};
			let found;
			({index,found}=contexts.keyWordList({keywords:state,statement,index,scope}));
			if(!found){state["def"]=true;}
			let value;
			({index,value}=await contexts.expression_short({statement,index,scope}));
			const label=Variable.fromValue(value);
			if(label){
				if(state["let"])Object.assign(scope.labels,label.labels);
				if(state["set"])scope.code.push(...label.code);
				if(state["def"])await evalBlock(label.getCode(),undefined,scope);
			}
			return{index};
		},
		async parameters({index=0,statement,scope,functionObj}){//'a,b,c' in '(a,b,c){};'
			//does not include brackets
			const params=functionObj.parameters=[];
			for(const param of statement){
				const statement=param;//statement == e.g. [ 'a' , ',' ]
				let index=0;
				for(let i=0;i<statement.length&&index<statement.length;i++){
					let word=statement[index];
					if(word=="..."){//'...otherArgs,' trailing parameter, 
						throw Error("0xmin error: #: trailing parameters are not supported yet.");
					}
					if(word.match(nameRegex)){
						params.push(new Parameter({name:word}));
						break;
					}
					else{//'foo(,,){}'
						params.push(new Parameter());//empty space. does not create a parameter.
					}
				}
			}
			//UNFINISHED
		},
		arguments_addArgument(argsObj,value){

		},
		async arguments({index,statement,scope,includeBrackets=true}){
			//'(a, b, c) ::{} ::{}'
			//always includes brackets
			let argsObj={
				obj:{},
				list:[],
			};
			if(includeBrackets){
				if(statement[index]=="("){
					const argBlock=statement[index+1];
					index+=3;
					for(const statement of argBlock){
						let index=0;
						({value,index}=await contexts.expression({index,statement,scope,includeBrackets:false}));
						if(value){
							argsObj.list.push(value);
							//argsObj.obj[value.name]=value.label;
						}
					}
				}else throw Error("compiler error: contexts.arguments() starts at '('")
				//'::{}' => block argument
				for(let i=0;i<statement.length&&index<statement.length;i++){
					if(statement[index]!="::")break;
					let value;
					({value,index}=await contexts.expression_short({index,statement,scope}));
					if(value){
						argsObj.list.push(value);
						//argsObj.obj[value.name]=value.label;
					}
				}
			}
			return {index,argsObj};
		},
		async expression_short({index,statement,scope,shouldEval=true,isLet=false}){//a().b or (1+1)
			if(!statement[index])return{index};
			//shouldEval = true: can cause mutations, false: just needs to return where the expression ends.
			let value,array;let failed;
			let word=statement[index];
			if(({index,value}=await contexts.number({index,statement,scope})).value!=undefined) {
				//'12'
				let number=value;
				if(shouldEval)value=new Value({number,type:"number",bool:!!number});
			}else if(({index,value,array}=await contexts.string({index,statement,scope})).value!=undefined) {
				//'"abc"'
				let string=value;
				if(shouldEval)value=new Value({string,type:"string",array});
			}else if(!({index,value,failed}=await contexts.delcareFunctionOrObject({index,statement,scope,shouldEval,startValue:value})).failed){}
			else if("([".includes(word)){//'(label)'
				({index,value}=await contexts.expression({index,statement,scope,includeBrackets:true,shouldEval}));
			}else if(word.match(nameRegex)){//'label'
				if(shouldEval){
					value=new Value();
					value.name=word;
					let {label,parent}=scope.findLabel(value.name)??{};
					value.label=label;
					value.parent=parent;
				}
				index++;
			}else{
				//value=new Value();
				return {index,value:undefined};
			}
			let asd=value;
			for(let i=index;i<statement.length;i++){//'.asd'
				if(index>=statement.length)break;
				let word=statement[index];
				let oldIndex=index;
				({value,index}=await contexts.extend_value({index,statement,scope,value,shouldEval,isLet}));
				if(index==oldIndex)break;
			}
			return {value,index};
		},
		//test for function declaration: stops 'a = ()=>{}' turning into: ['a=()', '=>', '{}']
		//note: 'a = () = {}' ==> 'a=() = {}' ==> '(a=()) = ({})'
		//note: for functions it is advised to use '#(){}' instead of '(){}' to prevent
		//expression_short:
			async extend_value({index,statement,scope,value,shouldEval=true,isLet=false}){//.b or [] or ()
				if(value==undefined||value.type=="undefined")value=scope.label;//'(.b)' == 'b'
				let word=statement[index];
				if([".", ".."].includes(word)){// 'a.' or 'a..'
					let isInternal=word=="..";
					let parent=value.label;
					value.parent=parent;
					let oldIndex=index;
					index++;
					let name,nameFound=false;
					word=statement[index];
					//optional expression
					if(name==undefined){
						if(word.match(nameRegex)){//'a.b' ?
							name=word;
							nameFound=true;
							index++;
						}
					}if(!nameFound){//'a.123' ?
						({index,value}=await contexts.number({index,statement,}));
						if(value)nameFound=true;
					}if(!nameFound){//'a.("b")' ?
						({index,value}=await contexts.expression({index,statement,scope,includeBrackets:true}));
						name=value?.string;
						if(value)nameFound=true;
					}if(!nameFound){
						throw Error("0xmin error: "+"index:`"+oldIndex+"` of '"+statement.join(" ")+"'"+" does not return a property name");
					}
					value.name=name;

					if(shouldEval){
						if(isInternal){//'a..b';
							value.label=getInternals(value,{index,statement,scope}).labels[name];//internal object
						}//'a.b'
						else value.label=parent.labels[name];
					}
					return {index,value};
				}
				//'foo(){}' or 'obj{}' extend function or object
				else if(!({index,value,failed}=await contexts.delcareFunctionOrObject({index,statement,scope,startValue:value,isExtension:true,shouldEval,isLet})).failed){
					value.isExtendedByBlock=true;
					return {index,value};
				}else if("("==word||(functionCallTypes.includes(word)&&statement[index+1]=="(")){
					//function call: 'foo()' to 'foo=>()::{}::{}'
					let startIndex=index;
					let functionType="";
					if(functionCallTypes.includes(word)){
						functionType=word;
						index++;
					}
					let argsObj;
					({index,argsObj}=await contexts.arguments({index,statement,scope,functionType}));
					if(value.type=="label"&&value.label!=undefined){
						({value}=await value.label.callFunction(argsObj,value,scope));
					}
					return {index,value};
				}else{
					return {index,value};
				}
			},
			delcare_typeChecks(isExtension,startValue,isLet){
				if(isExtension){//'obj{}'
					//type checking
					if(startValue==undefined)throw Error("0xmin error: #: startValue is not defined");
					if(!(startValue instanceof Value))throw Error("compiler type error:");
					if(startValue.type!="label")throw Error("0xmin type error: startValue is not a label");
					if(isLet||!startValue.label){
						startValue.label=new Variable({name:startValue.name});
					}
				}
			},
			async delcareFunctionOrObject({index,statement,scope,startValue=undefined,isExtension=false,shouldEval=true,isLet=false}){
				let value=startValue;
				let word=statement[index];
				if(word=="("&&(
					statement[index+3]=="{"||
					functionCallTypes.includes(statement[index+3])&&statement[index+4]=="{"
				)){//function declaration '(){}'
					contexts.delcare_typeChecks(isExtension,startValue,isLet);
					const newFunctionObj=shouldEval?new MacroFunction({
						type:"function",
					}):undefined;
					const functionObj=isExtension&&!isLet?startValue.label:newFunctionObj;
					if(shouldEval)await contexts.parameters({index:0,statement:statement[index+1],scope,functionObj});
					index+=3;//skip '(' '...' ')' in '(...){}'
					word=statement[index];
					if(functionCallTypes.includes(word)){//e.g. '=>' in '()=>{}'
						newFunctionObj.callType=word;
						functionObj.callType=word;
						index++;
					}
					word=statement[index+1];//word== '...' in '(){...}'
					newFunctionObj.scope=new Scope({
						parent:scope,
						code:word,
					});
					index+=3;
					if(shouldEval){
						//word == '...code' in '(){...code}'
						if(isExtension&&!isLet){//'foo(){}' use existing function
							newFunctionObj.scope.label=functionObj;
							if(functionObj.scope){//moves label.scope into label.code if it has not done aleady;
								functionObj.code.push(new MacroFunction({scope:functionObj.scope}));
								functionObj.scope=undefined;
							}
							functionObj.code.push(newFunctionObj);
						}
						if(startValue)startValue.label=functionObj;
						value=startValue??new Value({type:"label",label:functionObj});
					}
					return {index,value,failed:false};//isExtension&&!startValue};
				}else if(word=="{"){
					contexts.delcare_typeChecks(isExtension,startValue,isLet);
					index++;
					if(shouldEval){
						//makes block scope
						let newScope=await evalBlock(
							statement[index],
							scope,
							isExtension
								?new ObjectScope({parent:scope,label:startValue.label,code:statement[index]})
								:undefined
						);
						value=startValue??new Value({type:"label",label:newScope.label});
					}
					index+=2;
					return {index,value,failed:false};//failed:isExtension&&!startValue};
				}else {
					return {index,value,failed:true};
				}
			},
		//----
		operators:{
			"+":new Operator_numeric((a,b)=>a+b),
			"-":new Operator_numeric((a,b)=>a-b),
			"*":new Operator_numeric((a,b)=>a*b),
			"/":new Operator_numeric((a,b)=>a/b),
		},
		async expression({index,statement,scope,startValue=undefined,includeBrackets=true,shouldEval=true}){//a + b
			let value=new Value();
			const argsObj=new Variable({code:[]});
			const args=argsObj.code;
			const operatorRegex=/[+\-*/]/;//:Regex
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
				//ignore '#' in '#(' or '#{'
				if("#$@".includes(word)&&"({[".includes(statement[index+1])){//'#()' or '#{}' ==> '()' '{}'
					//used to spit expresions e.g. '(){}'==>[function] '() #{}' ==> [expression,object]
					index++;
				}
				else if(";)]}".includes(word))break;
				else if("#$@".includes(word))break;
				else if(["=", "=>"].includes(word)){
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
								newLabel=Variable.fromValue(new Value(value))
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
				else if(word in contexts.operators){
					index++;
					let hasEquals;
					if(statement[index]=="="){hasEquals=true;index++}
					let value;{//get second arg
						({index,value}=await contexts.expression_short({index,statement,scope,shouldEval}));
						args.push(value);
					}
					contexts.operators[word].do({args,hasEquals});
				}
				else if(!nameLast){//not: 'name name'
					if(!endingStringList.includes(word)){//word.match(nameRegex)||["(", "[", "{"].includes(word)){
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
		async main(label){//(Variable) => Variable / MachineCode
			const codeQueue=this.collectCode(label);
			const {assemblyCode}=await this.assignMemory(codeQueue,label);
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
			async assignMemory(codeQueue,label){
				"use strict";
				if(!(codeQueue instanceof Array))throw Error("compiler type error: 'codeQueue' is not a normal Array.");
				if(!(label instanceof Variable))throw Error("compiler type error");
				let lastFails=codeQueue.length;
				let startingCpuState=new CpuState({relativeTo:label});
				let cpuState=new CpuState();
				const assemblyCode=new MachineCode()
				for(let i=0;i<codeQueue.length;i++){
					let fails=0;
					cpuState.setValues(startingCpuState);
					for(let i=0;i<codeQueue.length;i++){
						const instruction=codeQueue[i];
						let failed=false;
						if(instruction instanceof HiddenLine){
							///@mutates: cpuState,label;
							({failed}=await this.evalHiddenLine({instruction,cpuState,code:codeQueue,label,assemblyCode}));
						}
						else if(instruction instanceof AssemblyLine){
							if(cpuState.virtualLevel<=0)assemblyCode.code[cpuState.lineNumber]=instruction;
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
				let relAddress,failed;
				if(instruction.run[Symbol.toStringTag]=="AsyncFunction")
					({relAddress,failed}=await instruction.run({cpuState}));
				else
					({relAddress,failed}=instruction.run({cpuState}));
				return {failed};
			},
		//----
		//@ phase : (binary phase)
			assembly:{//0xmin assembly language
				language:"0xmin",
				instructionSet:{
					"null":0,
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
					this.pointers[name="jump"]=new Pointer(name);
					this.pointers[name="move"]=new Pointer(name);
					this.pointers[name="ram"]=new Pointer("lineNumber");
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
				if(value instanceof HiddenLine){return value;}
				if(!(value instanceof Value))throw Error("compiler type error:");``
				/// value:number|Value
				if(value.type=="number")
					return new Variable({lineNumber:value.number});
				else if(value.type=="label")return (this.assembly.pointers[value.name]?.getState?.(cpuState)??value.label);
			},
			async decodeArgument(args,argNumber=0,cpuState,type="command"){///: {arg:number;failed:bool}
				let arg=args[argNumber];
				let failed=false;
				if(arg instanceof bracketClassMap["("]){//code tree
					let {value,index}=await contexts.expression({index:0,statement:arg});
					arg=value;
				}
				if(arg instanceof HiddenLine){
					({relAddress:arg,failed}=arg.run({cpuState}));
				}
				else if(arg instanceof Operator){
					throw Error("compiler type Error: @: operator argument not supported in @assembly phase");
				}
				else if(arg instanceof Value){
					if(arg.type=="number"){
						arg=arg.number;
					}
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
		async function evalDebugger({statement,index,scope,word=undefined,cpuState=undefined}){
			let failed=false;
			word??=statement[index];
			if(word=="debugger"){//debugger name "label";
				if(statement[index]=="debugger")index++;//if done in '#' phase
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
					const sandbox = {log:"no log;",...{index,statement,scope,value:inputValue,label:inputValue?.label,cpuState}};
					vm.createContext(sandbox);
					const code = "log = ["+str+"\n]";
					try{vm.runInContext(code, sandbox);}catch(error){
						console.warn(error);
						throw Error(", Could not run the javascript. threw:{{'"+error+"'}}");
					}
					console.warn("debugger:",...sandbox.log)
				}else{throw Error("expected string in 'debugger' ");}
			}
			return{index,failed};
		}
		///@abstract
		//includes '= (' '+ =' '- ='
		class Operator extends Array{
			operator;//:string ;
			type;//:string ; for special operator types e.g. '+=' or '=('
			constructor(word,args=[]){
				super(...args);
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
			}
			parent;//'parent.name' ==> label
			refType;//'a.b','a[b]','set a {b}';
			label;//label Object
			name;//label name (from parent.labels)
			type="label";//label|number|array|string; label == array == function
			bool=false;
			number=0;//relAddress
			get array(){return this.label?.code;}//code ///arry: Variable|CodeLine; from: Variable.prototype.code
			set array(val){(this.label??=new Variable()).code=val;}
			isExtendedByBlock=false;//done when 'foo(){}' or 'obj{}'; used so that: 'let foo(){}' ==> 'let foo = #(){}'
			static Number=
			class Number extends Value{constructor(number){super({number,type:"number"});}}
			//Value.prototype.toNumber
			toNumber(value=this){//to number type
				let number;//:number
				if(value.type=="number"){number=value.number}
				else if(value.type=="label")number=value.label?.lineNumber;
				else if(value.type=="string")number=value.string[0]?.charCodeAt?.();
				else if(value.type=="array")throw Error("0xmin type error: the array  Value type is not fully supported yet.")
				return new Value.Number(number);
			}
		}
		//returns interal values
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
			relativeTo;//:CodeLine|Variable
			virtualLevel=0;//:int
			jump=0;//:int ; line pointer
			move=0;//:int ; data pointer
			lineNumber=0;//:int
		}
		///@abstract
		class CodeLine extends DataClass{//assembly line of code
			//constructor(data){super();Object.assign(this,data??{})}
			cpuState=null;//:CpuState|null
			scope;//:Scope; UNUSED
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
			static Define=
			class Define extends HiddenLine{//'$def a;'
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				run({cpuState}){//nextlineNumber
					this.label.lineNumber=cpuState.lineNumber;
					return{failed:false,relAddress:this.label.lineNumber};
				}
			}
			static RelocateCurrentLineNumber=
			class RelocateCurrentLineNumber extends HiddenLine{//'$ram 10;'
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				run({cpuState}){
					cpuState.lineNumber=this.label.lineNumber;
					return{failed:false,relAddress:this.label.lineNumber};
				}
			}
			static SetLabelOrPointer=
			class SetLabelOrPointer extends HiddenLine{//'$ram 10;'
				constructor(data){super();Object.assign(this,data??{})}
				operator=null;///:Variable
				isSearched=false;
				run({cpuState}){///: {failed:boolean;relAddress:number}
					let returnValue=0;
					let failed=false;
					if(["->", "<-", "=>", "<="].includes(this.operator.operator)){
						if(["<-", "<="].includes(this.operator.operator)){
							//reverse args
							const temp=this.operator[0];
							this.operator[0]=this.operator[1];
							this.operator[1]=temp;
							this.operator.operator=this.operator.operator[1]+">";
						}
						//true ==> mutates cpuState or label-lineNumbers
						const isAssigning = this.operator.operator=="=>";
						const args=[
							assemblyCompiler.findPointerOrLabel(this.operator[0],cpuState),
							this.operator[1]
						];
						if(this.operator[1] instanceof HiddenLine||this.operator[0] instanceof HiddenLine){
							if(this.isSearched)throw Error("compiler error: $: infinite recursion found.");
							this.isSearched=true;
							throw Error("compiler UNFINISHED error: '$a => b->c;' is not supported yet");
							let {failed:failed1,relAddress}=this.operator[1].run({cpuState});
							this.operator[1]=new Value.Number(relAddress);
							failed||=failed1;
							this.isSearched=false;
							//jump->move->2;
						}
						else if(this.operator[1] instanceof Value){
							if(this.operator[1].type=="number"){//'$jump->5;'
								returnValue=this.operator[1].number+cpuState.lineNumber-args[0].lineNumber;
								failed||=isNaN(returnValue);
								if(isAssigning)args[0].lineNumber=this.operator[1].number;
							}
							else{//'$jump->label;' or '$label->jump'
								args[1]=assemblyCompiler.findPointerOrLabel(this.operator[1],cpuState);
								returnValue=args[1].lineNumber+this.operator[1].toNumber().number-args[0].lineNumber;
								failed||=isNaN(returnValue);
								if(isAssigning)args[0].lineNumber=args[1].lineNumber+this.operator[1].number;
							}
						}else throw Error("compiler type error: $:");
					}
					return{failed,relAddress:returnValue};
				}
			}
			//'virual {...};'
				static Virtual=//'$virtual;' starts virtual scope
				class Virtual extends HiddenLine{
					cpuState;//:private CpuState
					run({cpuState}){
						this.cpuState=new CpuState(cpuState);
						cpuState.virtualLevel++;
						return{failed:false};
					}
				}
				static Void=//'$void;' ends virtual scope
				class Void extends HiddenLine{
					linkedLine;//:private Virtual|CodeLine
					constructor(linkedLine){super();this.linkedLine=linkedLine;}
					run({cpuState}){
						cpuState.setValues(this.linkedLine.cpuState);
						cpuState.virtualLevel--;
						return{failed:false};
					}
				}
			//----
			static Debugger=
			class Debugger extends HiddenLine{
				statement;//:code tree
				index;//:number
				scope;//:Scope
				word="debugger";//:const
				//also uses cpuState;
				constructor(data){super();Object.assign(this,data??{})}
				async run({cpuState}){
					this.cpuState=new CpuState(cpuState);
					await evalDebugger(this);
					return {failed:false};
				}
			}
		}
		class MetaLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
		}
		;
		class Parameter{
			constructor(data){Object.assign(this,data??{});}
			name="";
			default=undefined;//default value 'foo(arg=2){}'
		};
		class Variable extends DataClass{// codeObj/label
			constructor(data){super();Object.assign(this,data??{})}
			//as value
				type="label";
			//as object
				//names: [value],(compiler generated/inbuilt),<instance>,{important inbuilt constant}
				name=undefined;///@string
				labels={};//aka properties
				prototype=null;///instanceof Variable
				supertype=null;///instanceof Variable
			//as array
				code=[];//:(CodeLines|Variable)[]
			//as function
				callType="";//:'' | '=>' | '=' | '->' | '<-' etc...
				parameters=[];//:Parameter[]
				scope=null;//the scope that the code should be called with. the scope contains the code
			//as assembly
				relAddress=0;//number UNUSED
				lineNumber=undefined;
				defs=[];//UNUSED;//:Variable[]; for removing def's of a label. stores places where '$def this;' and '$set this;' are used: '#undef: this;'
				//defineLine=null;//instanceof AssemblyLine
			//----
			get address(){//UNUSED
				const address=this.defineLine?.address;
				return address==undefined?undefined:address+this.relAddress;
			}
			isSearched=false;
			get returnLineNumber(){
				if(isSearched)return;
				isSearched=true;
				let codeObj=this.code[this.code.length-1];
				const lineNumber = codeObj instanceof Variable?codeObj.returnLineNumber:codeObj.lineNumber;
				isSearched=false;
				return lineNumber;
			}
			getCode(){//: SourceCodeTree
				const codeBlock=new bracketClassMap["{"];
				if(this.isSearched)return codeBlock;
				this.isSearched=true;
				if(this.scope?.code)codeBlock.push(...(this.scope?.code||[]));
				else codeBlock.push(
					...this.code.reduce((s,v)=>{
						let code=v.getCode?.();
						if(code instanceof Array)s.push(code);
						;
						return s;
					},[])
				);
				this.isSearched=false;
				return codeBlock;
			}
			async callFunction(args={},callingValue,scope){
				//args: {obj;list}
				//args.obj: {[key:"string"]:Value}
				//args.list: Value[]
				const argsObj=new Variable({
					name:"(argument object)",
					labels:{},
					code:[]
				});
				for(let i=0;i<args.list.length;i++){
					let label=Variable.fromValue(args.list[i]);
					argsObj.labels[this.parameters[i].name]=label;
					argsObj.code.push(label);
				}
				let codeBlock=this.getCode();//new code instance
				let instanceScope=new Scope({
					parent:this.scope??globalScope,
					label:argsObj,
					code:codeBlock
				});
				let returnObj=new Variable({name:"(return)"});
				switch(this.callType){
					case"="://class
					argsObj.labels["this"]??=argsObj;
					argsObj.labels["return"]??=returnObj;
					argsObj.labels["arguments"]??=argsObj;
					break;
					case"=>"://arrow function
					;
					break;
					case"<="://'using(){}'
					instanceScope.let=instanceScope;
					instanceScope.var=instanceScope;
					instanceScope.parent=instanceScope;
					argsObj.labels["this"]??=callingValue.parent;
					argsObj.labels["scope"]??=scope;
					break;
					default:
					instanceScope.let=instanceScope;
					argsObj.labels["this"]=callingValue.parent;
					argsObj.labels["return"]=returnObj;
					argsObj.labels["arguments"]??=argsObj;
				}
				await evalBlock(codeBlock,undefined,instanceScope);
				
				//if no return label created, it returns the 
				let newReturnObj=argsObj.labels["return"];
				if(!(newReturnObj&&newReturnObj!=returnObj)){
					newReturnObj=argsObj;
				}
				return {value:new Value({type:"label",label:newReturnObj})};
			}
			findLabel(name){//'a.b'
				return (
					this.supertype?.findLabel?.(name)
					??(this.labels[name]?{label:this.labels[name],parent:this}:undefined)
					??this.prototype?.findLabel?.(name)
				);
			}
			static fromValue(value,scope=undefined){//label|number|array|string
				if(value?.type=="label")
					return value.label;
				if(value?.type=="number")
					return new Variable({
						name:"["+value.number+"]",
						lineNumber:value.number,
						code:[new AssemblyLine({type:"data",dataType:"number",args:[value.number],scope})],
						scope:new Scope({code:new bracketClassMap["{"]([""+value.number,";"])}),
					});
				//if(value?.type=="array")//instance of built-in array
				//	return new Variable({name:"<(array)>",code:value.array});
				if(value?.type=="string")
					return valueStringToArray(value,scope);
				return new Variable({name:"(undefined)",});
			}
		}
		//Internal
			class BuiltinFuntion extends Variable{
				constructor(foo){super();this.run=foo;}
				run=({value,args})=>new Value();
				async callFunction(args={},callingValue,scope){
					//args: {obj;list}
					//args.obj: {[key:"string"]:Value}
					//args.list: Value[]
					return {value:await this.run({
						args:args.list,
						label:callingValue.parent,
						value:callingValue,
						scope
					})};
				}
			}
			const Internal=new (class extends Variable{
				constructor(){
					super();
					for(let i in this.labels){
						this.labels[i]=new BuiltinFuntion(this.labels[i]);
						Object.assign(this.labels[i],{
							name:"{"+i+"}",
						})
					}
				};
				labels={
					//"foo":({label,value,scope})=>new Value({type:"number",number:2}),
					"length":async({label})=>new Value({type:"number",number:label.code.length,name:"(..length)"}),
					"code":async({label})=>new Value({type:"label",label:new Variable({name:"(..code)",//BODGED
						code:label.getCode().map(v=>Variable.fromValue(new Value({type:"string",string:v+""}))),
					})}),
					"array":async({label})=>new Value({type:"label",label:new Variable({name:"(..array)",code:label.code})}),
					"labels":async({label})=>{
						let list=[];
						for(let i in label.labels)list.push(i);
						return new Value({type:"number",label:list,number:69});
					},
					"compile":async({label})=>new Value({type:"label",label:await assemblyCompiler.main(label),}),
				};
			});
		//--
		function getInternals(value,{index,scope,statement}){//:Variable
			return new Variable(Internal);
		}
		function valueStringToArray(value,scope){
			if(value?.type=="string")
			return new Variable({
				name:"<(string)>",
				code:value.string.split("").map(v=>new AssemblyLine({
					type:"data",
					dataType:"char",
					args:[assemblyCompiler.assembly.extraInstructions.string_char,v.charCodeAt(0)],
					scope,
				}))
			});
		}
		class MacroFunction extends Variable{}
		class Pointer extends Variable{///similar to Variable
			constructor(name){
				super();
				this.name=name;
				delete this.lineNumber;
			}
			type="pointer";
			cpuState;//the current bound cpuState
			name;
			getState(cpuState){
				if(!(cpuState instanceof CpuState))throw Error("compiler type error");
				this.cpuState=cpuState;
				return this;
			}
			get lineNumber(){if(this.cpuState)return this.cpuState[this.name];}
			set lineNumber(value){if(this.cpuState)this.cpuState[this.name]=value;}
			setState(cpuState){
				cpuState[this.name]=this.lineNumber;
			}
		}
		class MachineCode extends Variable{
			//code:AssemblyLine[];
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
				const parent=this.findLabelParent(name);//:Variable
				if(parent)return {parent,label:parent.labels[name]}
				else return;
			}
			findLabelParent(name,topLevel=true){//:Variable
				if(this.isSearched||!this.label)return undefined;
				this.isSearched=true;
				let val=this.label.findLabel(name);
				if(val){this.isSearched=false;return val.parent;}
				//if(name in this.label.labels)return this.label;
				if(this.parent){
					let parent=this.parent.findLabelParent(name,false);
					this.isSearched=false;
					return parent;
				}
				else {this.isSearched=false;return undefined;}
			}
		}
		class GlobalScope extends Scope{
			constructor(data){
				super(data);
				const mainObject=this.label.prototype=new Variable({name:["0xmin"],lineNumber:0,labels:{
					"null":Object.freeze(Object.assign(Variable.fromValue(new Value.Number(0)),assemblyCompiler.nullValue)),
				}});
				this.label.labels={"0xmin":mainObject};
			}
			label=new Variable({
				scope:this,
				name:["GlobalObject"],
			});
			parent=this;
			let=this;
			var=this;
		}
		class ObjectScope extends Scope{
			let=this;
			var=this;
		}
		class BlockScope extends Scope{
			label=new Variable({scope:this});
			let=this;
		}
	//----
	{
		const nullValue=assemblyCompiler.nullValue=new AssemblyLine({
			type:"undefined",
			args:[new Value({type:"label",name:"null",})],
			binaryValue:0,
		});
		Object.doubleFreeze(nullValue);
		assemblyCompiler.assembly.init();
	}
	//'{' ==> '{ ... }'
	let globalScope;
	async function evalBlock(block,parentScope=undefined,scope=undefined){
		//does not include brackets
		const includeBrackets=false;
		if(includeBrackets)throw Error("compiler error: not evalBlock does not support including brackets");
		if(!scope){
			if(!parentScope){
				scope=new GlobalScope({code:block});
				if(!globalScope)globalScope=scope;
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
		let assemblyCode=await assemblyCompiler.main(scope.label);
		return assemblyCode;
	}
	let parts=inputFile;
	parts=parseFile(parts,fileName);
	parts=bracketPass(parts);
	parts=await evalBlock(parts);
	parts=await evalAssembly(parts);
	//chars->words->expression->statement->codeObj->block
	//
	let outputFile=parts.asBinary();
	let outputBinary=new Uint32Array(outputFile);
	const outputAsString=()=>outputFile.map(v=>v.toString(16)).map(v=>"0".repeat(8-v.length)+v);
	loga("len("+outputFile.length+"):", ""+outputAsString());
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
		console.error("0xmin error: "+"needs input .0xmin file");
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