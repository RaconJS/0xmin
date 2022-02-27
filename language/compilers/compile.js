//node.js version 16
//BODGED
//UNFINISHED
//NEEDSTESTING
//TESTING
//TODO
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
	const wordsRegex=
	/\/\/[\s\S]*?\n|\/\*[\s\S]*?\*\/|\b0x(?:[a-f][A-F])+\b|0b[01]+|[0-9]+|(["'`])(?:[\s\S]*?[^\\])?\1|\s+|[\w_]+|[=-]>|::|\.{1,3}|[&|^]{2}|[!$%^&*()-+=\[\]{};:@#~\\|,<>/?]/g
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
			if(word in bracketMap){//handle brackets
				statement.push(bracketPass(words,word,true));
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
			if("\"'`".includes(statement[index])){
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
			while(["let","set","def"].include(word=statement[index])){
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
		},
		async main_assembly_arguments({statement,index,scope,instruction}){//'get' 
			for(let i=index;i<statement.length;i++){//returns a list of Value's/strings/numbers 
				if(index>=statement.length)break;
				let word=statement[index];
				let value;
				if({index,value}=contexts.number({index,statement})){//'2'
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
				if(word=="["){
					index++;
					let newScope=new Scope({parent:scope});
					newScope.label=new Variable({parent:newScope});
					value=new Value({type:"scope",name:"[",label:newScope});
					instruction.args.push(statement[index]);
					index++;
				}
				if("@$#:;])}".includes(word))break;
				else{
					instruction.args.push(word);
				}
			}
			return{index};
		},
		async main_assembly({statement,index,scope,codeObj}){
			if(!(codeObj instanceof Variable))throw Error("compiler Error");
			{
				let value;
				let instruction;
				let useInstruction=false;//use 'instruction' in the codeObj, false => meta only code.
				({value,index}=await contexts.expression_short({statement,index,scope}));
				if(!value){//';'undefined value
					;
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
						args:[v.charCodeAt(0)],
					})));
				}
				else{
					instruction=new AssemblyLine({
						type:"command",
					});
				}
				{//arguments
					({index}=await contexts.main_assembly_arguments({index,statement,scope,instruction}));
					if(instruction.args.length>0){
						useInstruction=true;
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
			let state={void:false,static:false}
			statement.maxRecur;
			statement.recur??=0;
			statement.recur++;
			let word=statement[index];
			if(statement.maxRecur<=(1??maxRecur))
			if(["repeat","recur"].includes(word)){
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
			if(["void","static","#","$","@"].includes(word))
			loop:for(let i=index;i<statement.length;i++){
				let word=statement[index];
				if(word=="#"){
					index++;
				}
				switch(word){
					case"void":{
					}break;
					case"static":{
					}break;
					case":":{
						break loop;
					}break;
					case"@":{
						;
					}break;
					case"$":{
						;
					}break;
					case"#":{
						;
					}break;
					default:{
						break loop;
					}
				}
			}
			statement.recur--;
			if(statement.recur==0){
				statement.maxRecur=undefined;
			}
			assemblyPart:{
				let value;
				({index,value}=await contexts.main_assembly({statement,index,scope,codeObj}));
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
			}else if(({index,value}=await contexts.number({index,statement,scope})).value) {
				//'12'
				let number=value;
				value=new Value({number,type:"number",bool:!!number});
			}else if(({index,value}=await contexts.string({index,statement,scope})).value) {
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
			let value=new Value();
			if(includeBrackets){
				if(includeBrackets && !"([{".includes(word)){
					return {index,value:undefined};//expression not found
				}
				let nextIndex=index+3;//including brackets
				statement=statement[index+1];
				index=0;
				//label,number,array:[function]
				statement=statement[index];
				for(let i=index;i<statement.length;i++){

				}
			}
			if(includeBrackets)return {index:nextIndex,value};
			else return {index,value};
		},
	};
	assemblyCompiler={
		main(scope){
			;
		},
		collectCode(codeObj,assemblyCode=new Variable()){
			if(!codeObj instanceof Variable)throw Error("compiler error: 'scope.label' is undefined.");
			const code=codeObj.code;
			for(const codeObj of code){//codeObj instanceof Variable
				if(codeObj instanceof AssemblyLine){
					assemblyCode.code.push(codeObj);
				}else if(codeObj instanceof Variable){
					assemblyCompiler.collectCode(codeObj,assemblyCode);
				}
			}
			return assemblyCode;
		},
		compileHiddenCode(){
			;
		},
		compileAssembly(){
			;
		},
		line(codeObj){
			;
		},
	};
	//classes
		///@abstract
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
		class Stack{
			list=[];
			constructor(list){
				if(list instanceof Stack){
					;
				}
			}
		}
		class CodeLine extends DataClass{//assembly line of code
			constructor(data){super();Object.assign(this,data??{})}
			type="number";///number,string,command
			args=[];///Value[];
		}
		class AssemblyLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
			command;
			data;
		}
		class MetaLine extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
		}
		;
		class Variable extends DataClass{// codeObj/label
			constructor(data){super();Object.assign(this,data??{})}
			type="label";
			code=[];//array
			labels={};//object
			parameters={};
			scope;//the scope that the code should be called with.
			relAddress=0;//number
			defineLine;
			prototype=null;
			supertype=null;
			findLabel(name){//'a.b'
				return
					this.supertype?.findlabel?.(name)
					??this.labels[name]
					??this.prototype?.findlabel?.(name)
				;
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
					part=await evalBlock(block,type,true);
				}
				else{
					if(word.match(/\/[*/]/))continue;//ignore comments
					part=word;
				}
			}
		}
		return scope;
	}
	function evalAssembly(scope){
		let assemblyCode=assemblyCompiler.collectCode(scope.label);
		return assemblyCode;
	}
	let parts=inputFile;
	parts=parseFile(parts,fileName);
	parts=bracketPass(parts);
	parts=await evalBlock(parts);
	parts=evalAssembly(parts);
	loga((parts.code))
	//chars->words->expresion->statement->codeObj->block
	//
	//(...)
	async function evalExpression(){}
	//{...}
	async function evalFunction({scope,words}){
	}
	let outputFile=[];
	let outputBinary=new Uint32Array(outputFile);
	return outputBinary;
};
let buildSettings={makeFile:false}
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