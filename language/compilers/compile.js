//node.js version 16
//BODGED
//UNFINISHED
//NEEDSTESTING
//TESTING
//TODO
//UNUSED
//TODO: prevent 'set a.b=b' from creating new labels
let TESTING=1;
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
		/\/\/[\s\S]*?(?:\n|$)|\/\*[\s\S]*?\*\/|(["'`])(?:\1|[\s\S]*?[^\\]\1)|\b0x(?:[0-9]|[a-f]|[A-F])+\b|0b[01]+|[1-9][0-9]+|[\w_]+|[=-]>|::|\.{1,3}|[&|\^]{1,2}|[><!]=|={1,3}|>{1,3}|<{1,2}|[!\$%*()-+=\[\]{};:@#~\\|,/?]|[\s\S]/g
		;
		const nameRegex=/^[\w_]/;
		const stringRegex=/^["'`]/;
		const openBracketRegex=/^[(\[{]/;
		const endingStringList=":;])}";
		const functionCallTypes=["=>", "=", "->"];
	//----
	//inputFile -> code tree
		//(long string,string) => (array of words)
		const mainFolder=fileName.match(/^[\s\S]*?(?=[^/]*?$)/)?.[0]??"";
		const compilerFolder=process.argv[1].match(/^[\s\S]*?(?=[^/]*?$)/)?.[0]??"";
		const files={};///:{[filePath]:code tree};
		const isStrict=true;
		const throwError=({statement,index,scope=undefined},errorType,msg)=>{
			let data=scope?scope.code.data:statement.data;
			return "0xmin "+errorType+" error: "+msg+"; line "+data.line+":'"+data.getLines()[data.line]+"'";
		};
		function parseFile(inputFile,filePath,fileName){
			"use strict";
			let wordsRaw=inputFile.match(wordsRegex)??[];
			let words=[];
			let wordsData=[];
			let lines=inputFile.split(/\n\s*/);
			let data={line:0,column:0,file:fileName,i:0,getLines(){return lines;}};
			words.fileName=fileName;
			words.filePath=filePath;
			//remove comments
			for(let i=0;i<wordsRaw.length;i++){
				let n;
				data.i=i;
				if(n=wordsRaw[i].match(/\n/g)){
					data.line+=n?.length??0;
					if(n)data.column=0;
				}
				data.column+=wordsRaw[i].match(/[^\n]*$/)[0].length;
				if(wordsRaw[i].match(/^\/[\/*]|^\s/)){
					//remove comments
				}
				else{
					words.push(wordsRaw[i]);
					wordsData.push({...data});
				}
			}
			words.i=0;
			words.data=wordsData;
			return words;
		};
		const bracketMap=Object.freeze({
			"{":"}",
			"[":"]",
			"(":")",
		});
		class Statement extends Array{
			constructor(words,arry=[]){
				super(...arry);
				this.data=words instanceof Array?words.data[words.i]:words;
			}
			data;//:{line:number;column:number;file:string;};
		};
		const bracketClassMap=Object.freeze({//this object is for debugging
			"{":({"{ }":class extends Statement{recur;maxRecur;}})["{ }"],
			"[":({"[ ]":class extends Statement{}})["[ ]"],
			"(":({"( )":class extends Statement{}})["( )"],
		});
		function bracketPass(words,type="{",includeBrackets=false,stackLevel=0){
			//stackLevel is for debugging only
			words.i??=0;
			let block=new bracketClassMap[type](words)??new Statement(words);//the current container: {...} or [...] or (...)
			let statement=new Statement(words);//the current item: '...;' or '...,'
			if(includeBrackets){//[...] => ['{',...,'}']
				if(words[words.i]!=type)throw Error("compiler error");
				block.push(words[words.i]);
				words.i++;
			}
			let brackets=0;
			for(let i=words.i,len=words.length;i<len+4&&words.i<words.length;i++){
				let word=words[words.i];
				if(word in bracketMap){//handle brackets '{...}' ==> ['{',[...],'}'];
					words.i++;
					statement??=new Statement(words);
					statement.push(word,//{
						bracketPass(words,word,false,stackLevel+1)//...
					,bracketMap[word]);//}
					words.i++;
				}
				else if((word=="," && type!="{")||((word == ";") && type=="{")){//then: new statement
					statement??=new Statement(words);
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
					statement??=new Statement(words);
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
			if(stackLevel==0){//note: causes mutation
				files[words.filePath]=block;
			}
			return block;
		}
	//----
	//extra classes
		class Operator_numeric{
			//numOfArgs: 1|2;
			///operation: () => number;
			operation;//:(any,any)=>any;
			leftArgOnly;//:(any)=>any;
			rightArgOnly;//:(any)=>any;
			constructor(operation_2Args=0,leftArgOnly=0,rightArgOnly=0){//(a+b,a+,+b)
				if(leftArgOnly)throw Error("compiler error: operator form: 'a +' is not supported");
				this.operation=operation_2Args;
				this.leftArgOnly=leftArgOnly;
				this.rightArgOnly=rightArgOnly;
			}
			do({args,hasEquals}){//nextArgData:{statement;scope;index;etc...} 
				///ans:number;
				let ans,arg0=args.pop(),arg1,fistArg;
				let number0=arg0?arg0.toNumber().number:undefined;
				let do1Arg=true;//true=> does 1 arguments operation instead.
				if(args.length>0&&this.operation){
					arg1=args.pop();
					if(arg1 instanceof Value){
						ans=this.operation((fistArg=arg1).toNumber().number,number0);
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
					if(this.rightArgOnly)ans=this.rightArgOnly(number0);
					else if(this.leftArgOnly)ans=this.leftArgOnly(number0);
					args.push(new Value.Number(ans));
				}
			}
		};
		class Operator_bool{
			needsSecondArg;//bool=>bool;//true => will evaluate the second argument
			operator;//(a:bool,b:bool,a:Value,b:Value)=>Value;//returns the value of the operator
			constructor(needsSecondArg,operator,is2Args=true){
				this.needsSecondArg=needsSecondArg;
				this.operator=operator;
				this.is2Args=is2Args;
			}
			static equality(value1,value2){//:bool
				value1=value1.toType(value2.type);
				return this.strictEquality(value1,value2);
			}
			static strictEquality(value1,value2){//:bool
				if(value1.type!=value2.type)return false;
				switch(value1.type){
					case"number":return value1.number===value2.number;break;
					case"string":return value1.string=value2.string;break;
					case"label":return value1.label=value2.label;break;
					case"array":return value1.array=value2.array;break;
					default: return false;
				}
			}
		}
	//----
	const contexts={
		//simple
			string({index,statement,scope}){//is optional
				let word=statement[index];
				if(word&&"\"'`".includes(word[0])){
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
			number_signs:{"+":v=>+v,"-":v=>-v,"*":v=>1*v,"/":v=>1/v},
			number({index,statement,scope}){//number is optional
				let sign="+";
				let oldIndex=index;
				let word=statement[index];
				if(word in contexts.number_signs){sign=word;index++;}
				let number=contexts.number_signs[sign](+statement[index]);
				if(!isNaN(number)){
					index++;
					return {index,value:number,sign};
				}else{
					return {index:oldIndex,value:undefined};
				}
			},
		//----
		async main({statement,index=0,scope},part=0){//codeObj; Bash-like statements
			///statement:code tree|Scope;
			if(statement instanceof Scope){
				await evalBlock(statement.code,statement,scope.label);
				return;
			}
			let codeObj=new Variable({name:"(code line)",type:"array"});
			let newScope=new Scope.CodeObj({fromName:"main",label:codeObj,parent:scope,code:statement});
			codeObj.scope=newScope;
			let state={void:false,static:false,virtual:false,phase:""};
			statement.maxRecur;
			if(index==0){
				statement.recur??=0;
				statement.recur++;
			}else statement.recur??=1;
			let word=statement[index];
			if(index>=statement.length
				||statement.recur>(statement.maxRecur??1)
			)return{index,value:newScope};
			if(["void", "static", "virtual", "#", "$", "@"].includes(word))
			loop:for(let i=index;i<statement.length;i++){
				let word=statement[index];
				({index}=contexts.phaseSetter({index,statement,scope,state}));
				switch(word){
					case"void"://does not add code to block
						state.void=true;index++;break;
					case"static"://UNUSED; does not add code to function; Allows code to be run in function block
						state.static=true;index++;break;
					case"virtual":
						state.virtual=true;index++;break;
					case":":
						index++;break loop;
					break;
					default:{
						break loop;
					}
				}
			}word=statement[index];
			if(["repeat", "recur"].includes(word)){//repeat 10: recur 10:
				index++;
				let repeatingIndex_number=index;
				let calcReps=async()=>{
					let value;
					({index,value}=await contexts.expression_short({statement,index:repeatingIndex_number,scope}));
					return value?.number-value?.number!==0?0:value.number|0;
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
			//'keyword : arg' or 'keyword arg'
			else if(["debugger", "import", "delete", "..."].includes(word)){
				if(word=="debugger"
					&&["","$","#"].includes(state.phase)
				){//debugger name "label";
					if(state.phase=="$"){
						newScope.label.code.push(new HiddenLine.Debugger({index,statement,scope}));
						index=statement.length;
					}
					else{
						//index++;
						//if(statement[index]==":")index++;
						({index}=await evalDebugger({index,statement,scope,word:"debugger"}));
					}
				}
				else if(word=="delete"//'delete a,b;' from any scope
					&&["","#"].includes(state.phase)
				){
					index++;
					if(statement[index]==":")index++;
					for(let i=0;i<statement.length&&index<statement.length;i++){
						let value;
						({value,index}=await contexts.expression_short({index,statement,scope}));
						if(value){
							if(value.parent&&value.label&&value.type=="label"){
								delete value.parent.labels[value.name];
							}
						}else {
							//delete all from let scope
							const labels=newScope.let.label.labels;
							for(let i in labels){
								delete labels[i];
							}
						}
						if(word!=","){//delete a,b,c ;
							break;
						}
					}
				}
				else if(word=="..."
					&&["","#"].includes(state.phase)
				){
					({index}=await contexts.main_injectCode({index,statement,scope}));
				}
				else if(word=="import"
					&&["","@","$","#"].includes(state.phase)
				){
					index++;
					({index}=await contexts.main_importFile({statement,index,scope,phase:state.phase}));
				}
			}{
				let virtualLine;
				if(state.virtual)newScope.label.code.push(virtualLine=new HiddenLine.Virtual({scope:newScope}));
				if(statement[index]=="{"){
					index++;
					newScope.label.code.push(
						(await evalBlock(statement[index++],scope)).label
					);
					index++;
				}
				else if(statement[index]!=";"&&index<statement.length){
					assemblyPart:{
						let value;
						if(state.phase==""){//auto detect phase
							word=statement[index];
							if(["let", "def"].includes(word))
								state.phase="#";
							else if(word&&(["undef", "ram"].includes(word)||word[0].match(/[a-zA-Z_]/)&&!(word in assemblyCompiler.assembly.instructionSet)))
								state.phase="$";
							else state.phase="@";
						}
						if(state.phase=="@")({index}=await contexts.main_assembly({statement,index,scope:newScope}));
						if(statement[index]=="$"){state.phase="$";index++;}
						if(state.phase=="$")({index}=await contexts.main_hidden({statement,index,scope:newScope}));
						if(statement[index]=="#"){state.phase="#";index++;}
						if(state.phase=="#")({index}=await contexts.main_meta({statement,index,scope:newScope}));
						;
					}
				}
				if(state.virtual)newScope.label.code.push(new HiddenLine.Void(virtualLine,{scope:newScope}));
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
			phaseSetter({statement,index,scope,state}){
				///state : {phase:string;}
				let word=statement[index];
				if("@$#".includes(word)){
					state.phase=word;
					index++;
				}
				return{index};
			},
			keyWordList({statement,index,scope,keywords}){//'let set:'
				///keywords: interface{[key:string]:bool}
				let word,found=false;
				while((word=statement[index]) in keywords){
					keywords[word]=true;
					index++;
					found=true;
				}
				if(word==":")index++;
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
						({value,index}=await contexts.expression_short({statement,index,scope}));
						if(value){
							foundExpression=true;
							const newLabel=new Variable({name:value.name});
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
					if(metaState["def"]){//same as '$undef def set: obj;' ==> redefines and inserts code block;
						if(value instanceof Value && value.type=="label")
						if(value.label){//for '@null $def: label'
							value.label.unDefine();
							contexts.meta_defineLabelToNextLine(value.label,scope,value,true);
							scope.label.code.push(value.label);
						}else{
							if(isStrict)throw Error(throwError({statement,index,scope},"type","label '"+value.name+"' is undefined"));
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
					let number,sign;
					({value:number,index}=contexts.number({statement,index,scope}));
					value.number=number;
				}
				return {index};
			},
			async main_hidden({statement,index,scope}){
				let value,word,found;
				const state={"def":false,"set":false,"undef":false};
				({index,found}=contexts.keyWordList({index,statement,scope,keywords:state}));
				//note: '$def' is used instead of '$insert' to reduce number of keywords
				state["insert"]=state["def"];
				if(!found){//sets defaults
					state["undef"]=true;
					state["set"]=true;//'$set label;' assigns line number to labels
					state["insert"]=true;//'$def obj;' inserts code block into assembly
				}
				({value,index}=await contexts.expression_short({statement,index,scope}));
				word=statement[index];
				if(state["undef"]){//remove all refrences of an object from the code
					if(value?.type=="label"&&value.label){
						value.label.unDefine();
					}
				}
				if(state["set"]){//'$set labelA;' or '$set labelA=>labelB' ==> sets label address
					let arg1;
					({value:arg1,index}=await contexts.main_assembly_expression_short({statement,index,scope,startValue:value}));
					if(arg1){
						scope.label.code.push(arg1);
					}else{
						contexts.meta_defineLabelToNextLine(value.label,scope,value);
						if(value.label)value.label.defs.push(scope.label);
					}
				}
				if(state["insert"]){//'$set label;' => inserts contence of label
					scope.label.code.push(value.label);
					if(value?.label)value.label.defs.push(scope.label);
				}
				return{index};
			},
			meta_defineLabelToNextLine(label,scope,value,useUnshift=false){
				//done in the line Assignment phase
				if(label==undefined)throw Error(throwError({scope},"","label '"+value.name+"' is not declared"));
				let newLineObj=new HiddenLine.Define({label,scope});
				if(useUnshift)scope.label.code.unshift(newLineObj);
				else scope.label.code.push(newLineObj);
			},
			//short expression
			async main_assembly_expression_short({statement,index,scope,startValue=undefined}){//Value=>Value|HiddenLine
				let word=statement[index];//'label' ==> 'label+1' or 'label => label+2'
				let value;
				let hadStartValue=!!startValue;
				if(word=="["){//UNFINISHED: needs to be redone
					index++;
					let newScope=new Scope({fromName:"main_assembly_argument",parent:scope,code:statement[index]});
					newScope.label=new Variable({scope:newScope});
					value=new Value({type:"scope",name:"[",label:newScope});
					index++;
				}else{
					({value,index}=await contexts.expression_short({statement,index,scope,includeBrackets:false}));
				}
				startValue=value??startValue;
				if(!hadStartValue && startValue!=value){
					throw Error("compiler error: the values must be the same in 'jump jump->x;' and different in 'jump->x;'"
						+"this can break the cpuState checker"
					);
				}
				word=statement[index];
				if(["->", "<-", "=>", "<="].includes(word)){
					index++;
					({value,index}=await contexts.expression_short({statement,index,scope,startValue}));
					let operator=new Operator(word,[startValue,value]);
					word=statement[index];
					if("+-".includes(word)||word[0].match(/[0-9]/)){//'move->label+1;' or 'move->label 5;'
						({value,index}=await contexts.expression_short({statement,index,scope,startValue}));
						operator.push(value);
					}
					const hiddenLine=new HiddenLine.SetLabelOrPointer({operator,scope});
					value=hiddenLine;
					//'[a, -> [], b]' => '[a, -> [b]]'
				}
				else{
				}
				return{index,value};//:Value|HiddenLine
			},
			async main_assembly_argument({statement,index,scope,instruction}){
				///@mutates: instruction,index;
				let word=statement[index];
				let value;
				let startValue=instruction.args[instruction.args.length-1];//:Value|HiddenLine
				({value,index}=await contexts.main_assembly_expression_short({statement,index,scope,startValue}));
				if(value)instruction.args.push(value);
				return{index};
			},
			async main_assembly_arguments({statement,index,scope,instruction}){//'get'
				let startValue=instruction.args[instruction.args.length-1];//:Value|HiddenLine
				if(startValue instanceof Value && startValue.type=="label"){
					startValue.number=0;
				}
				for(let i=index;i<statement.length;i++){//returns a list of Value's/strings/numbers 
					let word=statement[index],failed;
					if(index>=statement.length)break;
					if(({index,failed}=contexts.endingSymbol({statement,index})).failed)break;
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
							instruction.binaryValue=codeObj.lineNumber=instruction.args[0];
							instruction.type="data";
						}else{
							instruction.type="command";
						}
					}
					if(useInstruction){
						codeObj.code.push(instruction);
					}
				}
				return {index};
			},
			async main_importFile({statement,index,scope,phase="#"}){
				if((oxminCompiler.TEST??0)>4){throw Error("too much import recursion")}
				else{oxminCompiler.TEST??=0;
					oxminCompiler.TEST++;
				}
				//phase is used to get the file type
				let word;
				let filePath="";//:string;
				let fileName="";//:string; for debugging only
				getFilePath:{
					const fromTypes={
						"lib":compilerFolder+"../include/",
						"main":mainFolder,
						"this":statement.file??mainFolder,
						"compiler":compilerFolder,
					};
					word=statement[index];
					if(word in fromTypes){
						filePath=fromTypes[word];
						index++;
					}else filePath=fromTypes["this"];
					({index,value:fileName}=contexts.string({statement,index,scope}));
					if(fileName==undefined||fileName==""){//silent error
						return {index};
					}
					filePath+=fileName;
				}
				if(phase=="")phase="#";
				if(phase=="#"){//open as 0xmin file
					let fileData;//:code tree;
					if(filePath in files){
						fileData=files[filePath];//if file already exists, use it
					}else {
						let fileString=await oxminCompiler.fileLoader(filePath);
						fileData=bracketPass(parseFile(fileString,filePath,fileName));
					}
					if(statement[index]==":")index++;
					await evalBlock(fileData,undefined,scope);
				}
				index=statement.length;
				return {index};
			},
		//----
		//'...scope;
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
				if(state["let"])Object.assign(scope.let.label.labels,label.labels);
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
						throw Error(throwError({index,statement,scope},"#","trailing parameters are not supported yet."));
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
		endingSymbol({index,statement}){
			//'#()' or '#{}' ==> '()' '{}'
			//used to spit expresions e.g. '(){}'==>[function] '() #{}' ==> [expression,object]
			let failed=false;
			if("@$#".includes(statement[index])){
				if("([{".includes(statement[index+1]))index++;
				else failed=true;
			}if(endingStringList.includes(statement[index]))failed=true;
			return {index,failed:failed??index>=statement.length};
		},
		async arguments({index,statement,scope,functionType,includeBrackets=true}){
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
						let {value,index}=await contexts.expression({index:0,statement,scope,includeBrackets:false});
						if(value){
							argsObj.list.push(value);
							//argsObj.obj[value.name]=value.label;
						}
					}
				}else throw Error("compiler error: contexts.arguments() starts at '('")
				//'::{}' => block argument
				for(let i=0;i<statement.length&&index<statement.length;i++){
					if("@$#".includes(statement[index])){index++;break;}
					if(statement[index]!="::")break;
					index++;
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
		async expression_short({index,statement,scope,shouldEval=true,includeBrackets=false}){//a().b or (1+1)
			if(includeBrackets){statement=statement[index+1];index=0;}//assumes statement[index]=="("
			if(!statement[index])return{index};
			//shouldEval = true: can cause mutations, false: just needs to return where the expression ends.
			let word=statement[index];
			let value,array,failed;
			if(({index,failed}=contexts.endingSymbol({statement,index})).failed)return{index};
			word=statement[index];
			if(word instanceof Array)throw Error ("compiler type error???: do not know how 'let word:Array;' is handled by the code");
			if(({index,value}=await contexts.number({index,statement,scope})).value!=undefined) {//'+123' or '-123'
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
				if(!TESTING)return {index,value:undefined};
			}
			return await contexts.expression_fullExtend({value,index,statement,scope,shouldEval});
		},
		//test for function declaration: stops 'a = ()=>{}' turning into: ['a=()', '=>', '{}']
		//note: 'a = () = {}' ==> 'a=() = {}' ==> '(a=()) = ({})'
		//note: for functions it is advised to use '#(){}' instead of '(){}' to prevent
		//expression_short:
			async getIndexedPropertyName({index,statement,scope}){
				let name,failed=false;
				({index,value:name}=await contexts.expression({index,statement,scope,includeBrackets:true}));
				if(name){
					if(name.type=="label")name=name.label?.symbol??undefined;
					else if(name.type=="number")name=name.number;
					else if(name.type=="string")name=name.string;
				}else failed=true;
				return {index,name,failed};
			},
			async expression_fullExtend({value,index,statement,scope,shouldEval=true}){
				for(let i=index;i<statement.length;i++){//'.property'
					if(index>=statement.length)break;
					let word=statement[index];
					let oldIndex=index;
					({value,index}=await contexts.extend_value({index,statement,scope,value,shouldEval}));
					if(index==oldIndex)break;
				}
				return{value,index};
			},
			async extend_value({index,statement,scope,value,shouldEval=true}){//.b or [] or ()
				let word=statement[index];
				if([".", "..", "["].includes(word)){// 'a.' or 'a..' or 'a['
					if(value==undefined||value.type=="undefined")value=scope.var.label.toValue("label");//'(.b)' == 'b'
					let isInternal=word=="..";
					let parent=value.label;
					value=new Value({parent});
					let oldIndex=index;
					let name,nameFound=false;
					if(word!="["){index++;word=statement[index];}
					//optional expression
					if(word.match(nameRegex)){//'a.b' ?
						name=word;
						nameFound=true;
						index++;
					}if(!nameFound){//'a.123' ?
						({index,value:name}=await contexts.number({index,statement,scope}));
						if(name!==undefined)nameFound=true;
					}if(!nameFound&&["(", "["].includes(word)){//'a.("b")' or 'a["b"]' ?
						({index,name,failed:nameFound}=await contexts.getIndexedPropertyName({index,statement,scope}));
						nameFound=!nameFound;
					}
					if(!nameFound){
						throw Error(throwError({scope:instruction.scope},"index:`"+oldIndex+"` of '"+statement.join(" ")+"'"+" does not return a property name"));
					}else{
						value.name=name;
					}
					if(shouldEval)if(parent){
						if(isInternal){//'a..b';
							const label=getInternals(value,{index,statement,scope}).labels[name];//internal object
							if(label)({value}=await label.callFunction(undefined,value,scope));
						}//'a.b'
						else {
							if(typeof name=="string")value.label=value.parent.findLabel(name)?.label;
							if(typeof name=="number"){//'a[b]'
								value.refType="array";
								if(name<0)name=name+(parent.code?.length??0);//a[]
								value.number=name;
								value.label=
									parent.code[name] instanceof Variable?parent.code[name]:
									parent.code[name] instanceof Scope?parent.code[name].label:
									parent.code[name] instanceof CodeLine?undefined
								:undefined;
							}
						}
					}
					return {index,value};
				}else if("("==word&&//'foo()'; parses: 'foo=>()=>{}' ==> 'foo=>() => {}'; 'foo()=>{}' ==> 'foo ()=>{}'
					!(statement[index+3]=="{"||functionCallTypes.includes(statement[index+3])&&statement[index+4]=="{")
					||(functionCallTypes.includes(word)&&statement[index+1]=="(")
				){
					//function call: 'foo()' to 'foo=>()::{}::{}'
					let startIndex=index;
					let functionType="";
					if(functionCallTypes.includes(word)){
						functionType=word;
						index++;
					}
					//'foo=>()=>{}' ==> 'foo => #()=>{}'let argsObj;
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
			delcare_typeChecks(isExtension,startValue){
				if(isExtension){//'obj{}'
					//type checking
					if(startValue==undefined)throw Error("0xmin error: #: startValue is not defined");
					if(!(startValue instanceof Value))throw Error("compiler type error:");
					if(startValue.type!="label")throw Error("0xmin type error: startValue is not a label");
					if(!startValue.label){
						startValue.label=new Variable({name:startValue.name});
					}
				}
			},
			async delcareFunctionOrObject({index,statement,scope,startValue=undefined,shouldEval=true}){
				const isExtension=!!startValue;
				let value=startValue;
				let word=statement[index];
				if(word=="("&&(
					statement[index+3]=="{"||
					functionCallTypes.includes(statement[index+3])&&statement[index+4]=="{"
				)){//function declaration '(){}'
					contexts.delcare_typeChecks(isExtension,startValue);
					let functionObj={callType:null};//:Variable|temp object
					if(shouldEval){
						functionObj=isExtension?startValue.label
							:new MacroFunction({type:"function",})
						;await contexts.parameters({index:0,statement:statement[index+1],scope,functionObj});
					}
					value=functionObj.toValue("label");
					index+=3;//skip '(' '...' ')' in '(...){}'
					word=statement[index];
					let callType="";
					if(functionCallTypes.includes(word)){//e.g. '=>' in '()=>{}'
						functionObj.callType=callType=word;
						index++;
					}
					word=statement[index+1];//word== '...' in '(){...}'
					let functionScope=new FunctionScope({fromName:"delcareFunctionOrObject/function",
						label:new Variable({name:"(scope function)"}),
						parent:scope,
						code:word,
					});
					switch(callType){
						case"":functionScope.let=functionScope;break;
						case"=":functionScope.let=functionScope;functionScope.var=functionScope;break;
						case"=>":break;
					}
					functionObj.code.push(functionScope);
					functionObj.functionPrototype??=new Variable({name:"(prototype)"});
					functionObj.functionSupertype??=new Variable({name:"(supertype)"});
					index+=3;
					return {index,value,failed:false};//isExtension&&!startValue};
				}else if(word=="{"){//'{}' object declaration
					contexts.delcare_typeChecks(isExtension,startValue);
					index++;
					if(shouldEval){
						//makes block scope
						let newScope=await evalBlock(
							statement[index],
							scope,
							isExtension
								?new ObjectScope({fromName:"delcareFunctionOrObject/object",parent:scope,label:startValue.label,code:statement[index]})
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
			"+":new Operator_numeric((a,b)=>a+b,0,a=>+a),
			"-":new Operator_numeric((a,b)=>a-b,0,a=>-a),
			"*":new Operator_numeric((a,b)=>a*b),
			"/":new Operator_numeric((a,b)=>a/b,0,a=>1/a),
			">>>":new Operator_numeric((a,b)=>a>>>b),
			">>":new Operator_numeric((a,b)=>a>>b),
			"<<":new Operator_numeric((a,b)=>a<<b),
			"**":new Operator_numeric((a,b)=>a**b),
			"%":new Operator_numeric((a,b)=>a%b),
			"^":new Operator_numeric((a,b)=>a^b),
			"&":new Operator_numeric((a,b)=>a&b),
			"~":new Operator_numeric((a,b)=>~(a|b),0,a=>~a),

			">=":new Operator_numeric((a,b)=>a>=b),
			"<=":new Operator_numeric((a,b)=>a<=b),
			">":new Operator_numeric((a,b)=>a>b),
			"<":new Operator_numeric((a,b)=>a<b),

			"==":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+ Operator_bool.equality(v1,v2))),
			"!=":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+!Operator_bool.equality(v1,v2))),
			"===":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+ Operator_bool.strictEquality(v1,v2))),
			"!==":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+!Operator_bool.strictEquality(v1,v2))),
			"!":new Operator_bool(v=>false,(b1,b2,v1,v2)=>!b1,false),

			"&&":new Operator_bool(v=>v,(b1,b2,v1,v2)=>!b1?v1:v2),//bool1,bool2,value1,value2
			"||":new Operator_bool(v=>!v,(b1,b2,v1,v2)=>b1?v1:v2),
			"^^":new Operator_bool(v=>!v,(b1,b2,v1,v2)=>b1?v2:b2?new Value.Number(0):v2),//xor
		},
		truthy(value){//(Value)=>bool
			if(!(value instanceof Value))return false;
			if(value.type=="number")return !!value.number;
			else if(value.type=="label")return !!value.label;
			else if(value.type=="string")return !!value.string;
			else if(value.type=="array")return !!value.array;
			else return false;
		},
		async expression({index,statement,scope,startValue=undefined,includeBrackets=true,shouldEval=true}){//a + b
			let value=new Value();
			const argsObj=new Variable({code:[]});
			const args=argsObj.code;//:Value[]
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
				let word=statement[index],value,failed;
				//ignore '#' in '#(' or '#{'
				if(({index,failed}=contexts.endingSymbol({statement,index})).failed)break;
				else if(["=", "=>"].includes(word)){
					index++;
					let firstArg=args.pop();
					let assignmentType;
					if(firstArg instanceof Operator){//'a += b'
						assignmentType=firstArg;
						firstArg=args.pop();
						if(!(firstArg instanceof Value))throw Error(throwError({index,statement,scope},"syntax",
							" not allowed to assign an expression to an operator e.g. '+ += 2' is not allowed."
						));
					}
					let value;//don't need to do `index++` here
					({value,index}=await contexts.expression({statement,index,scope,includeBrackets:false}));
					//value??=new Value();
					if(firstArg instanceof Value){
						if(assignmentType==undefined&&word=="="){//evals 'a = b'
							//let doAssignMent=0||(firstArg.name in firstArg.parent.labels);
							let newLabel;{
								//mutation
								newLabel=Variable.fromValue(new Value(value));
							}
							if(firstArg.type=="label"&&firstArg.parent){
								//overwrites variable 'a.b=2;' or 'a=2;'
								//refType:'property'|'array'
								if(firstArg.refType=="array")firstArg.parent.code[firstArg.number]=newLabel;
								else firstArg.parent.labels[firstArg.name]=newLabel;
								value=newLabel?.toValue?.("label")??new Value();
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
				//'foo(){}' or 'obj{}' extend function or object
				else if(args.length>0&&!({index,value}=await contexts.delcareFunctionOrObject({index,statement,scope,startValue:args[args.length-1],shouldEval})).failed){
					;
				}else if(word=="¬"){//extend value 'a+1¬.b'==> '(a+1).b'
					index++;let value=args.pop();
					({value,index}=await contexts.expression_fullExtend({value,index,statement,scope,shouldEval}));
					args.push(value);
				}else if(word in contexts.operators){//'+-*/'
					index++;
					if(shouldEval){
						let hasEquals,value;
						//get second arg
						const operator=contexts.operators[word];//:Operator_bool|Operator_numeric
						if(statement[index]=="="){hasEquals=true;index++}
						if(operator instanceof Operator_bool){
							let arg1=args.pop(value),bool1=contexts.truthy(arg1);
							if(operator.is2Args){
								let shouldEval=operator.needsSecondArg(bool1);
								({index,value}=await contexts.expression_short({index,statement,scope,shouldEval}));
								value=operator.operator(bool1,contexts.truthy(value),arg1,value);
							}else value=operator.operator(bool1,null,arg1,null);
							args.push(value);
						}
						else {//operator:Operator_numeric
							({index,value}=await contexts.expression_short({index,statement,scope,shouldEval}));
							args.push(value);
							operator.do({args,hasEquals});
						}
					}else{
						({index}=await contexts.expression_short({index,statement,scope,shouldEval}));
					}
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
	const assemblyCompiler={
		async main(label){//(Variable) => Variable / MachineCode
			const codeQueue=this.collectCode(label);//:CodeLine[]
			const {assemblyCode}=await this.assignMemory(codeQueue,label);//:Variable
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
					///lineObj:CodeLine|Variable|Scope
					if(
						lineObj instanceof HiddenLine||
						lineObj instanceof AssemblyLine
					)codeQueue.push(lineObj);
					if(lineObj instanceof Scope)continue;//lineObj=lineObj.label;
					if(lineObj instanceof Variable){
						this.collectCode(lineObj,codeQueue);
						codeQueue.push(new HiddenLine.DefineReturn({label:lineObj,scope:lineObj.scope}));
					}
				}
				return codeQueue;
			},
			async assignMemory(codeQueue,label){
				"use strict";
				if(!(codeQueue instanceof Array))throw Error("compiler type error: 'codeQueue' is not a normal Array.");
				if(!(label instanceof Variable))throw Error("compiler type error");
				let lastFails=codeQueue.length+1;
				let startingCpuState=new CpuState({relativeTo:label});
				let cpuState=new CpuState();
				const assemblyCode=new MachineCode();
				for(let i=0;i<codeQueue.length;i++){
					let fails=0;
					let failList=[];//{i;instruction;failed}[]
					cpuState.setValues(startingCpuState);
					for(let i=0;i<codeQueue.length;i++){
						const instruction=codeQueue[i];
						let failed=false;//failed:bool|[error,string]; can contain part of error message
						if(instruction instanceof HiddenLine){
							///@mutates: cpuState,label;
							({failed}=await this.evalHiddenLine({instruction,cpuState,code:codeQueue,label,assemblyCode}));
						}
						else if(instruction instanceof AssemblyLine){
							if(cpuState.virtualLevel<=0)assemblyCode.code[cpuState.lineNumber]=instruction;
							instruction.cpuState=new CpuState(cpuState);
							///@mutates: instruction,cpuState;
							({failed}=await this.compileAssemblyLine({instruction,assemblyCode,cpuState,code:codeQueue}));
							instruction.cpuStateAfter=new CpuState(cpuState);
						}
						if(failed){
							fails++;
							failList.push({i,instruction,failed});
						}
					}
					if(fails==0&&i>0)break;
					if(fails>=lastFails){
						let instruction=failList[0].instruction;
						let reason=(failList[0].failed||[Error(),"unspecified reason"]);
						console.error("",reason);
						throw Error(throwError({scope:instruction.scope},"@",": possibly uncomputable;"
							+"got: fails:"+fails+", i:"+i+";"
							+"reason: \""+reason[1]+"\""
						));
					}
					lastFails=fails;
				}
				for(let i=0;i<assemblyCode.code.length;i++){
					assemblyCode.code[i]??=this.nullValue;
				}
				return {assemblyCode};
			},
			//assembly compiling
			async compileAssemblyLine({instruction,cpuState,assemblyCode}){///:{failed:bool};
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
							if(this.assembly.language=="0xmin"&&i==1&&instruction.type=="command"){
								//compile address; handles 0xmin quirks
								let isJump=instruction.args[0]?.name=="jump";
								binaryArg=(arg<0||1/arg==-Infinity)?(((2*(arg&1)*isJump-arg)&0xff)*0x10)|0x1000:(Math.abs(arg)&0xff)*0x10;
								binaryValue|=binaryArg;
								instruction.moveBy=Math.min(Math.max(arg|0??0,-0xff),0xff);
								if(instruction.args[0]?.name=="move"){//'move+5;' ==> 'move=>move+5';
									if(!(instruction.args[1] instanceof HiddenLine)){
										cpuState.move+=instruction.moveBy;
									}
								}
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
					if(!failed)({failed}=await this.stateCheck({instruction,cpuState,assemblyCode}));
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
			findPointerOrLabel(value,cpuState,scope=undefined){//:HiddenLine|Pointer|Variable
				if(value instanceof HiddenLine){return value;}
				if(!(value instanceof Value))throw Error("compiler type error:");
				/// value:number|Value
				if(value.type=="number")
					return Variable.fromValue(value,scope);
				else if(value.type=="label")return (this.assembly.pointers[value.name]?.getState?.(cpuState)??value.label);
				else throw Error(throwError({scope},"$ type","value must be a label or a number."));
			},
			async stateCheck({instruction,cpuState,assemblyCode}){
				if(this.assembly.language=="0xmin"){//check 'jump -> x' and 'jump x;' statements
					if(instruction.type=="command"
						&&instruction.args.length>=2
						&&instruction.args[0]?.name=="jump"
						&&(instruction.args[1] instanceof HiddenLine.SetLabelOrPointer?
							instruction.args[1].operator?.[0]!=instruction.args[0]//does not check:'jump jump->label;' statements
							:true
						)
					){
						let address2=instruction.moveBy+instruction.cpuState.jump;
						let cpuState2=assemblyCode.code[address2]?.cpuState;
						if(!cpuState2){//allows jumping to unknown cpuStates
							if(0)return {failed:[Error(),"could not find cpuState of location:"+address2]};
							else return {failed:false};
						}
						if(cpuState2&&cpuState2.move!=cpuState.move){
							return {failed:[Error(),"cpuState miss-match, missing: 'move "+cpuState.move+" -> "+cpuState2.move+";'"]};
						}
					}
				}
				return {failed:false};
			},
			async decodeArgument(args,argNumber=0,cpuState,type="command"){///: {arg:number;failed:bool}
				let arg=args[argNumber];
				let failed=false;
				if(arg instanceof bracketClassMap["("]){//code tree
					const scope=undefined;
					throw Error("compiler error: @: scope is not defined. '@()' is not supported yet");
					let {value,index}=await contexts.expression({index:0,statement:arg,scope});
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
				if(statement[index]==":")index++;//if done in '#' phase
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
					const sandbox = {log:"no log;",...{index,statement,scope,value:inputValue,label:inputValue?.label,cpuState,Variable,Value,BlockScope,ObjectScope,Scope}};
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
			constructor(data){
				//"use strict";
				//Object.assign(this,data);
				//Object.seal(this,data);
			}
			//constructor(data){Object.assign(this,data??{})}
		}
		class Brackets extends Array{
			;
		}
		class Value extends DataClass{
			constructor(data){super();Object.assign(this,data??{})}
			fromLabel(label){//UNUSED
				this.label=label;
				this.type="label";
				this.number=label.lineNumber;
			}
			parent;//'parent.name' ==> label
			refType="property";//:'property'|'array'; 'a.b','a[b]','set a {b}';
			label;//label Object
			name;//label name (from parent.labels)
			string;
			type="label";//label|number|array|string; label == array == function
			bool=false;
			number=0;//relAddress
			get array(){return this.label?.code;}//code ///arry: Variable|CodeLine; from: Variable.prototype.code
			set array(val){(this.label??=new Variable()).code=val;}
			static Number=
			class Number extends Value{constructor(number,data={}){super({number,type:"number",...data});}}
			//Value.prototype.toNumber
			toNumber(value=this){//to number type
				let number;//:number
				if(value.type=="number"){number=value.number}
				else if(value.type=="label")number=value.label?.lineNumber;
				else if(value.type=="string")number=value.string[0]?.charCodeAt?.();
				else if(value.type=="array")throw Error("compiler error: the array Value-type is not fully supported yet.");
				return new Value.Number(number);
			}
			toString(value=this){
				let string;//:number
				if(value.type=="number"){string=""+value.number}
				else if(value.type=="label"){if(value.label)string=value.label.code.reduce((s,v)=>{
					if(v instanceof AssemblyLine)
					if(v.dataType=="char")s+=String.fromCharCode(+v.args[1]);
					else if(v.dataType=="number")s+=String.fromCharCode(+v.args[0])
					return s;
				},"");}
				else if(value.type=="string")string=value.string;
				else if(value.type=="array")throw Error("compiler error: the array Value-type is not fully supported yet.");
				return new Value({type:"string",string});
			}
			toType(type){
				switch(type){
					case"number":return this.toNumber();break;
					case"string":return this.toString();break;
					//case"array":return this.array;break;
					case"label":return Variable.fromValue(this).toValue("label");break;
				}
			}
			toJS(){//UNUSED
				switch(this.type){
					case"number":return this.number;break;
					case"string":return this.string;break;
					case"array":return this.array;break;
					case"label":return {...this.label.labels};break;
				}
			}
		}
		//returns interal values
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
			getData(){return {l:this.lineNumber,j:this.jump,m:this.move,v:this.virtualLevel};}
			data(){return [this.lineNumber,this.jump,this.move,this.virtualLevel];}
		}
		///@abstract
		class CodeLine extends DataClass{//assembly line of code
			//constructor(data){super();Object.assign(this,data??{})}
			cpuState=null;//:CpuState|null
			scope;//:Scope;
		}
		class AssemblyLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
			//binaryValue is the final value of this line of code.
			//also used in meta (#) phase represent the value.
			type="number";///number,string,command
			args=[];///(Value|HiddenLine|number)[];
			binaryValue=undefined;
			dataType=undefined;//optional used with e.g.'String.char(5)' in '"text";'
			command;
			data;
			cpuStateAfter;//the cpuState after this line is run;
			moveBy;//:number relAddress part of instruction. used for state checking
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
			static DefineReturn=
			class DefineReturn extends HiddenLine{//'$def a;'
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				run({cpuState}){//nextlineNumber
					this.label.returnLineNumber=cpuState.lineNumber;
					return{failed:false,relAddress:this.label.returnLineNumber};
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
				operator=null;///:Operator, Value[]
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
							assemblyCompiler.findPointerOrLabel(this.operator[0],cpuState,this.scope),
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
								args[1]=assemblyCompiler.findPointerOrLabel(this.operator[1],cpuState,this.scope);
								if(!args[1]){throw Error("compiler error: args[1] is not defined");}
								let addAddress=0;
								if(this.operator[2]){//'$jump->label+1;'
									args[2]=assemblyCompiler.findPointerOrLabel(this.operator[2],cpuState,this.scope);
									addAddress=args[2]?.lineNumber??0;
								}
								returnValue=args[1].lineNumber-args[0].lineNumber+addAddress;
								failed||=isNaN(returnValue);
								if(isAssigning)args[0].lineNumber=args[1].lineNumber+addAddress;
							}
						}else {console.error("Error, type:",this.operator[1]?.constructor);
							throw Error("compiler type error: $: this.operator[1] is the wrong type");
						}
					}
					return{failed,relAddress:returnValue|0};
				}
			}
			//'virual {...};'
				static Virtual=//'$virtual;' starts virtual scope
				class Virtual extends HiddenLine{
					cpuState;//:private CpuState
					run({cpuState}){
						this.cpuState=new CpuState(cpuState);
						cpuState.virtualLevel++;
						return{failed:false,relAddress:0};
					}
				}
				static Void=//'$void;' ends virtual scope
				class Void extends HiddenLine{
					linkedLine;//:private Virtual|CodeLine
					constructor(linkedLine,data){super(data);this.linkedLine=linkedLine;}
					run({cpuState}){
						cpuState.setValues(this.linkedLine.cpuState);
						return{failed:false,relAddress:0};
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
				static objectNum=0;
				symbol=Symbol(Variable.objectNum++);
				prototype=null;///instanceof Variable
				supertype=null;///instanceof Variable
			//as array
				code=[];//:(CodeLines|Variable|Scope)[]
			//as function
				callType="";//:'' | '=>' | '=' | '->' | '<-' etc...
				parameters=[];//:Parameter[]
				scope=null;//the scope that the code should be called with. the scope contains the code
				functionPrototype;//:Variable
				functionSupertype;//:Variable
			//as assembly
				returnLineNumber;//:number; defined in collectCode
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
			getCode(n=0){//: SourceCodeTree; can contain Scope
				let codeBlock;
				if(this.isSearched)return codeBlock;
				this.isSearched=true;
				if(this.scope){///this.scope:Scope|Scope.CodeObj;
					if(this.scope instanceof Scope.CodeObj)codeBlock = new bracketClassMap["{"](this.scope.code.data,[this.scope.code]);
					else if(this.scope instanceof FunctionScope)codeBlock = new bracketClassMap["{"](this.scope.code.data,[this.scope]);
					else if(this.scope instanceof Scope)codeBlock = new bracketClassMap["{"](this.scope.code.data,[this.scope]);// this.scope.code
					else {console.error(this.scope?.constructor);throw Error("compiler type error:");}
				}
				else this.code.reduce((s,v)=>{
					///code: Variable ?? CodeLine|FunctionScope
					if(v instanceof Scope)s.push(v);//pushes :FunctionScope
					else if(v instanceof Variable)s.push(...v.getCode?.(n+1));//pushes :...FunctionScope|code tree
					//else if(v instanceof CodeLine)s.push(v.code);
					return s;
				},codeBlock=new bracketClassMap["{"]());
				if(codeBlock.length>0)codeBlock.data=codeBlock[0].data;
				this.isSearched=false;
				return codeBlock;
			}
			async callFunction(args,callingValue,scope){//:{value}
				args??={obj:{},list:[]};
				//args: {obj;list}
				//args.obj: {[key:"string"]:Value}
				//args.list: Value[]
				const argsObj=new Variable({
					name:"(argument object)",
					labels:{},
					code:[]
				});
				const newLabel=new Variable({name:"<"+this.name+">"});
				for(let i=0;i<args.list.length;i++){
					let label=Variable.fromValue(args.list[i]);
					if(this.parameters.length){
						argsObj.labels[this.parameters[i].name]=label;
						newLabel.labels[this.parameters[i].name]=label;
					}
					argsObj.code.push(label);
				}
				let codeBlock=this.getCode();//new code instance
				let instanceScope=new Scope({
					fromName:"callFunction",
					parent:this.scope??globalScope,
					label:newLabel,
					code:codeBlock
				});
				let returnObj=new Variable({name:"(return)"});
				switch(this.callType){
					case"="://class
					instanceScope.let=instanceScope;
					instanceScope.var=instanceScope;
					newLabel.prototype=this.functionPrototype;
					newLabel.supertype=this.functionSupertype;
					newLabel.labels["this"]??=newLabel;
					newLabel.labels["return"]??=newLabel;
					newLabel.labels["arguments"]??=argsObj;
					newLabel.labels["constructor"]??=argsObj;
					break;
					case"=>"://arrow function
					;
					break;
					case"<="://'using(){}'
					instanceScope.let=instanceScope;
					instanceScope.var=instanceScope;
					instanceScope.parent=instanceScope;
					newLabel.labels["this"]??=callingValue.parent;
					newLabel.labels["scope"]??=scope;
					break;
					default:
					instanceScope.let=instanceScope;
					newLabel.labels["this"]=callingValue.parent;
					newLabel.labels["return"]=returnObj;
					newLabel.labels["arguments"]??=argsObj;
				}
				await evalBlock(codeBlock,undefined,instanceScope);
				//if no return label created, it returns the 
				let newReturnObj=newLabel.labels["return"];
				if(!(newReturnObj&&newReturnObj!=returnObj)){
					newReturnObj=newLabel;
				}
				return {value:new Value({type:"label",label:newReturnObj})};
			}
			findLabel(name){//'a.b' string=>{parent:Variable,label:Variable}
				return (
					this.supertype?.findLabel?.(name)
					??(this.labels[name]?{label:this.labels[name],parent:this}:undefined)
					??this.prototype?.findLabel?.(name)
				);
			}
			unDefine(){//'$undef label';
				//defs:Variable[]
				for(let i=0;i<this.defs.length;i++){
					let code=this.defs[i].code;
					let index=code.indexOf(this);
					if(index!=-1)code.splice(index,1);
				}
				this.defs=[];
				this.lineNumber=undefined;
				return this;
			}
			getNumber(){return this.lineNumber;}
			getString(){return this.code.reduce((str,code)=>str+(code instanceof Variable)?code.getString():String.fromCharCode(+code.args[0])??"","")}
			toValue(type="number"){//:string
				let value=new Value();
				value.type=type;
				switch(type){
					case"number":value.number=this.getNumber();break;
					case"label":value.label=this;break;
					case"string":value.string=this.getString();break;
					//case"array":value.label=this.getNumber();break;//unsupported
				}
				return value;
			}
			static fromValue(value,scope=undefined){//label|number|array|string
				if(value?.type=="label")
					return value.label;
				if(scope!==null)scope??=globalScope;//BODGED
				if(value?.type=="number"){
					return new Variable({
						name:"["+value.number+"]",
						lineNumber:value.number,
						code:[new AssemblyLine({type:"data",dataType:"number",args:[value.number],scope})],
						//scope:new Scope({fromName:"Variable.fromValue",parent:scope,code:new bracketClassMap["{"]([""+value.number,";"])}),
					});
				}
				//if(value?.type=="array")//instance of built-in array
				//	return new Variable({name:"<(array)>",code:value.array});
				if(value?.type=="string")
					return valueStringToArray(value,scope);
				return new Variable({name:"(undefined)",});
			}
		}
		//Internal
			class BuiltinFuntion extends Variable{//'{builtIn}'
				constructor(foo,name){super();this.run=foo;this.name="{"+name+"}";}
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
			class BuiltinFuntionFunction extends BuiltinFuntion{//UNFINUSHED, UNUSED
				async parameters({label}){//..splice(a,b,c);
					let value=Internal.splice.toValue("label");
					value.parent=label;
					return value;
				}
				async callFunction(args={},callingValue,scope){
					//args: {obj;list}
					//args.obj: {[key:"string"]:Value}
					//args.list: Value[]
					return {value:await this.parameters({
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
						this.labels[i]=new BuiltinFuntion(this.labels[i],i);
					}
					this.splice=new BuiltinFuntion(async({label,args,value})=>{
						args[0]??=new Value.Number(0);
						args[1]??=new Value.Number(0);
						args[2]??=new Variable().toValue("label");
						args=[args[0].toNumber().number,args[1].toNumber().number,Variable.fromValue(args[2]).code];
						if(args[0]<0)args[0]+=label.code.length;//'a[-1]' => 'a[a..length-1]'
						label.code.splice(args[0],args[1],...args[2]);
						return label.toValue("label");
					},);
				};
				labels={//'a..b'
					///(Variable)=>Value
					//"foo":({label,value,scope})=>new Value({type:"number",number:2}),
					"length":async({label})=>new Value.Number(label.code.length),
					"code":async({label})=>new Variable({name:"(..code)",//BODGED
						code:label.getCode().map(v=>Variable.fromValue(new Value({type:"string",string:v+""}))),
					}).toValue("label"),
					"splice":async({label})=>{//..splice(a,b,c);
						let value=Internal.splice.toValue("label");
						value.parent=label;
						return value;
					},
					"array":async({label})=>new Variable({name:"(..array)",code:label.code}).toValue("label"),
					"labels":async({label})=>{
						let list=[];
						for(let i in label.labels)list.push(i);
						return new Value({type:"array",array:list,number:69});
					},
					"compile":async({label})=>(await assemblyCompiler.main(label)).toValue("label"),
					"seal":async({label})=>{Object.seal(label.labels);Object.seal(label.code);return label;},
					"freeze":async({label})=>{Object.freeze(label.labels);Object.freeze(label.code);return label.toValue("label");},
					"this":async({label})=>label.toValue("label"),
					"return":async({label})=>new Return(label).toValue("label"),
					//from this object
					//`obj.prototype`
					"prototype":async({label})=>label.prototype.toValue("label"),
					"supertype":async({label})=>label.supertype.toValue("label"),
					//from parent function
					//`obj.constructor`
					//"constructor":async({label})=>label.constructor.toValue("label"),
					"proto":async({label})=>label.functionPrototype.toValue("label"),
					"super":async({label})=>label.functionSupertype.toValue("label"),
				};
			});
		//----
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
		class Return extends Variable{
			type="return";
			constructor(label,data={}){
				super(data);this.label=label;
				delete this.lineNumber;
			}
			label;//:Variable
			get lineNumber(){return this.label.returnLineNumber;}
			set lineNumber(val){this.label.returnLineNumber=val;}
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
				else if(!(this instanceof GlobalScope)){throw Error("needs parent")}
				if(!(this.code instanceof Array))throw Error("compiler type error: Scope class requires `this.code` to be a source code tree;");
			}//requires: label,parent,code
			made=Error();
			fromName;//for TESTING only
			label=null;//label that owns this scope, label contains properties.
			//scopes
				parent=null;
				var=null;
				let=null;
			//----
			isSearched=false;
			code;//: bracketClassMap["{"];
			getStack(getdata=(s)=>s.label.name,stack=[]){
				if(this.isSearched)return stack;
				this.isSearched=true;
				stack.push(getdata(this,this.label.name));
				this.parent.getStack(getdata,stack);
				this.isSearched=false;
				return stack;
			}
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
			static CodeObj=class CodeObj extends Scope{}//single line of code.
		}
		class GlobalScope extends Scope{
			constructor(data){
				super(data);
				const mainObject=this.label.prototype=new Variable({name:["0xmin"],lineNumber:0,labels:{
					"null":Object.freeze(Object.assign(Variable.fromValue(new Value.Number(0),this),assemblyCompiler.nullValue)),
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
		class FunctionScope extends Scope{
			//label;
			//code;
			//parent;
		}
	//----
	//functions

	//----
	{
		const nullValue=assemblyCompiler.nullValue=new AssemblyLine({
			type:"undefined",
			args:[new Value({type:"label",name:"null",})],
			binaryValue:0,
			scope:"null's scope",
		});
		Object.doubleFreeze(nullValue);
		assemblyCompiler.assembly.init();
	}
	//'{' ==> '{ ... }'
	let globalScope;
	async function evalBlock(block,parentScope=undefined,scope=undefined){
		//does not include brackets
		///scope:Scope|Variable
		///block:code tree|Scope[]
		const includeBrackets=false;
		if(includeBrackets)throw Error("compiler error: not evalBlock does not support including brackets");
		let label;
		if(scope instanceof Variable){//used in function calls
			label=scope;scope=undefined;
		}
		if(!scope){
			if(!parentScope){
				scope=new GlobalScope({code:block});
				if(!globalScope){
					globalScope=scope;
				}
			}else{
				scope=new BlockScope({fromName:"evalBlock",parent:parentScope,code:block});
			}
			if(label)scope.label=label;
		}
		for(let i=0;i<block.length;i++){
			let statement=block[i];
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
	const hex30ToStr=v=>{v=v.toString(16);return "0".repeat(8-v.length)+v;};
	const outputAsString=()=>outputFile.map(v=>v.toString(16)).map(v=>"0".repeat(8-v.length)+v);
	loga("len("+outputFile.length+"):", ""
		+outputAsString()
		//+"\n"+parts.code.map(v=>v.cpuState.data().map(v=>hex30ToStr(v)).join(" ")+" "+hex30ToStr(v.binaryValue)).join("\n")
	);
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
			if(fileName.match(/compile\.js$/)||fileName=="testCode.0xmin"){
				fileName=process.argv[1].replace("compile.js","testCode.0xmin");
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