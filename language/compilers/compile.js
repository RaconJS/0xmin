//node.js version 16
//BODGED
//UNFINISHED
//NEEDSTESTING
//TESTING
//TODO
//UNUSED
//TODO: add 'break.name'
//TODO: #add '$void'
//TODO: $detect circular label definisions (more or less done done)
//TODO: #@make language definitions less BODGED and more formal
//TODO: organise asm types (tptasm,0xmin,asm etc...) into separate modules
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
		for(let i in obj)if(obj.hasOwnProperty(i)&&typeof obj[i]=="object")Object.freeze(obj[i]);
		Object.freeze(obj);
	};
//----
const oxminCompiler=async function(inputFile,fileName,language="0xmin"){//language:'0xmin'|'tptasm'
	"compiler error: type error;";
	//string consts
		const wordsRegex=//does not include: /\s+/
		/\/\/[\s\S]*?(?:\n|$)|\/\*[\s\S]*?\*\/|(["'`])(?:\1|[\s\S]*?[^\\]\1)|\b0x(?:[0-9]|[a-f]|[A-F])+(?:\.(?:[0-9]|[a-f]|[A-F])+)?\b|\b0b[01]+(?:\.[01]+)?\b|\b(?:0|[1-9])[0-9]*(?:\.[0-9]+)?\b|[\w_]+|<[=-]>|[=-]>|<[=-]|::|:>|<:|\.{1,3}|[&|\^]{1,2}|[><!]=|={1,3}|>{1,3}|<{1,3}|\*\*|[!\$%*()-+=\[\]{};:@#~\\|,/?]|[\s\S]/g
		;
		const nameRegex=/^[\w_]/;
		const stringRegex=/^["'`]/;
		const openBracketRegex=/^[(\[{]/;
		const endingStringList=":;])}";
		const functionCallTypes=["=>", "=", "->"];
		const settingsRegex=       /(?:\s*#\s*"[^"]*"\s*;)/g;
		const startOfFileRegex=/^(?:(?:\s*#\s*"[^"]*"\s*;)|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*/;
	//----
	//inputFile -> code tree
		//(long string,string) => (array of words)
		const mainFolder=fileName.match(/^[\s\S]*?(?=[^/]*?$)/)?.[0]??"";
		const compilerFolder=process.argv[1].match(/^[\s\S]*?(?=[^/]*?$)/)?.[0]??"";
		const files={};///:{[filePath]:code tree};
		const isStrict=true;
		const throwError=({statement,index,scope=undefined},errorType,msg)=>{
			let data=scope?scope.code.data:statement.data;
			data??=statement.data;
			return "0xmin "+errorType+" error: "+msg+"; line "+(data.line+1)+":'"+data.getLines()[data.line]+"'";
		};
		function parseFile(inputFile,filePath,fileName){
			"use strict";
			let words=[];
			let wordsData=[];
			let lines=inputFile.split(/\n[\t ]*/);//getLines is a function so that it doesn't show up in console logs
			highestSourceLineNumber=Math.max(highestSourceLineNumber,inputFile.split("\n").length);
			let data={line:0,column:0,file:fileName,i:0,getLines(){return lines;}};
			words.fileName=fileName;
			words.filePath=filePath;
			{//do settings
				//#"make file";
				let settings=inputFile.match(startOfFileRegex);
				{
					let comments=settings[0].replace(settingsRegex,m=>m.replaceAll(/\S/g," "))??"";
					inputFile=comments+inputFile.substr(settings[0].length);
					settings[0]=settings[0].replaceAll(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,"");
				}
				settings=(settings[0].match(/"([^"]+)"/g)??[]).map(v=>v.match(/(?<=")[\s\S]*?(?=")/));	
				const labels=mainObject.labels.settings.labels;
				const setLanguage=str=>assemblyCompiler.assembly.setLanguage(str)
				const settingsList={
					//v:bool
					"make file"(v){buildSettings.makeFile=v},
					"0xmin"(v){setLanguage("0xmin")},
					"tptasm"(v){setLanguage("tptasm")},
					"asm"(v){setLanguage("asm")},
					"int"(v){setLanguage("")},
					"code"(v){labels["log_code"].lineNumber=v},
					"table"(v){labels["log_table"].lineNumber=v},
					"len"(v){labels["log_length"].lineNumber=v},
				}
				settings.forEach(v=>{
					let turnOn=true;
					if(v[0]=="!"){
						reversed=false;
						v=v.substr(1);
					}
					settingsList[v]?.(turnOn);
				})
			}
			let wordsRaw=inputFile.match(wordsRegex)??[];
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
		let highestSourceLineNumber=1;
		const bracketMap=Object.freeze({
			"{": "}",
			"[": "]",
			"(": ")",
		});
		class Statement extends Array{
			static number=0;
			constructor(words,arry=[]){
				super(...arry);
				this.symbol=Statement.number;
				Statement.number++;
				this.data=words instanceof Array?words.data[words.i]:words;
			}
			toLabel(){
				return this.#asLabel??=new Variable({
					type:"statement",
					code:[...this.map(v=>(//v:String|`Statement`
						typeof v=="string"?new Value({
							type:"string",
							string:v,
							array:v.split("")
						}).toType("label")?.label
						:v//v:Statement
					))],
				});
			}
			#asLabel;
			recur={};//:{[Statement.symbol]:Number;}
			data;//:{line:number;column:number;file:string;getLines:getter=>string[];};
			symbol;//:number|Symbol
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
				if(bracketMap.hasOwnProperty(word)){//handle brackets '{...}' ==> ['{',[...],'}'];
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
					case"string":return value1.string===value2.string;break;
					case"label":return value1.label===value2.label;break;
					case"array":return value1.array===value2.array;break;
					default: return false;
				}
			}
		}
	//----
	const assembler={//oper,label
		tptasm:new class InstructionSet{
			constructor(){

			}
			keywordsRegex=/^(?:%|(?:[&|^+\-]|>>[>\-]?|[<\-]?<<)?=|->|hault|jump|if|null|store|carry|sign|overflow|0|\+|-|[!><=]=?|port|bump|wait|push|pop|call|return)$/;
			registerSymbol="%";
			ifParts=[];
			registers={
				"ip":"ip",
				"sp":"sp",
				...(()=>{
					let names={};
					for(let i=0;i<16;i++)names["r"+i]="r"+i;
					return names;
				})(),
				"stack":"sp",
				"instruction":"ip",
			};
			otherKeywords=Object.freeze({
				"if":"??",
				"r":"r",
				...this.registers,
			});
			optionals=Object.freeze({
				"carry":{
					useArray:true,
					map:{"add":["addc","!"],"adds":["addcs","!"],"sub":["sbb","+"],"subs":[,"+"]},
					defaultSymbols:[""],
				},
				"store":{
					map:{"add":"adds", "addc":"addcs", "sub":"subs", "sbb":"sbbs", "and":"ands", "xor":"xors", "or":"ors"},
					defaultSymbols:["","!"],
				},"internal":{
					map:{"shl":"scl", "shr":"scr"},
					defaultSymbols:["","+"],
				},
				"chain":{
					map:{"shl":"scl", "shr":"scr"},
					defaultSymbols:["","+"],
				},
			});
			operators=Object.freeze({//name:{map:default name
				"+":"add",
				"-":"sub",
				"=":"mov",
				"&":"and",
				"|":"or",
				"^":"xor",
				"mask":"swm",
				"hault":"hlt",
				"jump":"jmp",
				"null":"nop",
				">>":"shr",//scl with +chain
				"<<":"shl",//scr
				">>>":"ror",
				"<<<":"rol",
				"port":"bump",
				"check":"wait",
					//"cin":"recv",
					//"cout":"send",
				"push":"push",
				"pop":"pop",
				"call":"call",
				"return":"ret",
				//used to help the autophase-detector
					"if":null,
					"carry":null,
					"store":null,
					"internal":null,
				//old instruction set
				"send":"send",
				"recv":"recv",
				"wait":"wait",
				"bump":"bump",
				"mov":"mov",
				"db":"db",
				"dw":"dw",
				"and":"and",
				"or":"or",
				"xor":"xor",
				"add":"add",
				"adds":"adds",
				"adcs":"adcs",
				"sub":"sub",
				"subs":"subs",
				"sbb":"sbb",
				"sbbs":"sbbs",
				"shl":"shl",
				"shr":"shr",
				"ror":"ror",
				"rol":"rol",
				"scl":"scl",
				"scr":"scr",
				"push":"push",
				"pop":"pop",
				"call":"call",
				"ret":"ret",
				"hlt":"hlt",
				"jmp":"jmp",
				"nop":"nop",
				"jn":"jn",
				"jz":"jz",
				"jnz":"jnz",
				"jc":"jc",
				"jnc":"jnc",
				"jo":"jo",
				"jno":"jno",
				"js":"js",
				"jns":"jns",
				"jge":"jge",
				"jle":"jle",
				"je":"je",
				"jne":"jne",
				"jg":"jg",
				"jl":"jl",
				"swm":"swm",
			});
			flags={
				"0"       :{map:"ZF",jumpMap:["jnz", "jz"]},
				"carry"   :{map:"CF",jumpMap:["jnc", "jc"]},
				"overflow":{map:"OF",jumpMap:["jno", "jo"]},
				"sign"    :{map:"SF",jumpMap:["jns", "js"]},
			};
			ifOperations={//!>=,>=
				"true":"jmp",
				"false":"nop",
				">=":"jge",
				"<=":"jle",
				"==":"je",
				"!=":"jne",
				">":"jg",
				"<":"jl",
			};
			asm_ifStatement({statement,index,scope,operator,hasIf}){//#:string?
				let jumpType;
				if(statement[index]=="if"&&!hasIf)block:{
					index++;
					hasIf=true;
					let ifData={type:null,flag:null};
					if(this.ifOperations.hasOwnProperty(statement[index])){//'if >= x'
						ifData.type=statement[index++];
						if(statement[index]=="0")index++;//'if >=;'==> 'if >= 0;'
						ifData.flag="0";
						jumpType=this.ifOperations[ifData.type];
					}
					else {
						if(statement[index]=="!"){//'if !sin'
							ifData.type="!";
							index++;
						}
						if(this.flags.hasOwnProperty(statement[index])){//'if sign'
							ifData.flag=statement[index++];
							jumpType=this.flags[ifData.flag].jumpMap[+(ifData.type!="!")];
						}
						else{//'if;' or 'if !;'
							jumpType=this.ifOperations[""+(ifData.type!="!")];
						}
					}
					jumpType||=this.operators["null"];
					operator=jumpType;
				}
				return {index,operator,hasIf};
			}
			asm_optionalStatement({statement,index,scope,optionals}){
				//'a-=b !store +carry'
				let hasSymbol=false,symbol,optional="";//optional:string
				if("+-!".includes(statement[index])){
					hasSymbol=true;
					symbol=statement[index++];
				}
				if(this.optionals.hasOwnProperty(optional=statement[index])){
					optionals[optional]=symbol;
					index++;
				}
				else if(hasSymbol)index--;
				return {index};
			}
			async asm_NumberOrRegister({statement,index,scope},{arg}){//#:
				if(statement[index]==this.registerSymbol||statement[index]=="r"){
					index++;
					arg.push("r");
				}else if(this.registers.hasOwnProperty(statement[index])){
					arg.push(statement[index++]);
					return {index};
				}
				if(this.otherKeywords.hasOwnProperty(statement[index])){
					arg.push(statement[index++]," ");
				}
				let value;
				({index,value}=await contexts.expression_short({statement,index,scope,noSquaredBrackets:true}));
				if(value){arg.push(value);}
				return {index};
			}
			asm_operator({statement,index,scope,operator}){//#:string|undefined
				let word=statement[index];
				let hasOperator=false;
				if(!hasOperator&&this.operators.hasOwnProperty(word)&&this.operators[word]!=null){
					let oper1=word;
					index++;
					if((oper1.match(/^\W+$/)||1)&&["=","->"].includes(statement[index])){//'a + = b' ==> 'a + b'
						index++;//note: '=' is not required for 'a oper= b' although it is recomended for strict syntax
					}
					if(oper1=="="||oper1=="=>"){//%register = pop;
						word=statement[index];
						if(["pop", "recv", ""].includes(word)){
							oper1=word;
							index++;
						}
					}
					operator||=this.operators[oper1];
					hasOperator=true;
				}
				return {index,operator,hasOperator};
			}
			async asm_arg({statement,index,scope}){//#:(string|Value)[]
				let word=statement[index];
				let value;//:Value
				let arg=[];//:(string|Value)[]
				if(word=="["){
					index++;
					word=statement[index];
					arg.push("[");
					for(let i=0;i<word.length&&i<1;i++){
						let statement=word[i],index=0;
						({index}=await this.asm_NumberOrRegister({statement,index,scope},{arg}));
						if("+-".includes(statement[index])){
							arg.push(statement[index++]);
							({index}=await this.asm_NumberOrRegister({statement,index,scope},{arg}));
						}
					}
					index+=2;
					arg.push("]");
				}
				else{
					({index}=await this.asm_NumberOrRegister({statement,index,scope},{arg}));
				}
				return {index,arg};
			}
			async generateAssemblyLine({statement,index,scope}){//:void & mutates scope
				const instruction=new AssemblyLine({scope});
				let argsList=[];
				let operator,args=[],hasIf=false,hasOperator=false,optionals={};//optionals:Map
				for(let i=0;i<9;i++){
					let arg;
					if(!hasIf)({index,operator,hasIf}=this.asm_ifStatement({statement,index,scope,operator,hasIf}));
					if(!hasOperator)({index,operator,hasOperator}=this.asm_operator({statement,index,scope,operator}));
					({index}=this.asm_optionalStatement({statement,index,scope,optionals}));
					if(args.length<2){
						;({index,arg}=await this.asm_arg({statement,index,scope}));
						if(arg?.length>0){args.push(arg);}
						if(statement[index]==","&&args.length==1)index++;//'mov a,b;'
					}
					let word=statement[index],failed;
					if(({index}=contexts.endingSymbol({index,statement})).failed){break;}
				}
				if(args.length>1){args.splice(1,0,",");}
				if(!operator){
					let dataMask=0xffff;
					operator="dw";
					if(args.length==1&&args[0][0].type=="string"&&args[0][0].array.length>0){
						let instruction=[];//new Variable({name:"(string)"});
						for(let char of args[0][0].array){
							instruction.push(new AssemblyLine({scope,type:"data",dataType:"char",args:[operator,(valueCharToNumber(char,true)&dataMask)+""]}));
						}
						return {index,instruction,isArray:true};
					}
					else{
						instruction.type="data";
						instruction.dataType="number";
					}
				}
				else{
					for(let i in optionals){//optionals[number]:string & symbol
						if(!optionals.hasOwnProperty(i))continue;
						let optional=this.optionals[i];
						let fail=true;
						if(!optional){}
						if(optional&&(
							optional.defaultSymbols.includes(optionals[i])||
							(optional.useArray&&optional.map[operator][1]==optionals[i])
						)){
							if(optional.useArray)operator=optional.map[operator][0]??operator;
							else operator=optional.map[operator]??operator;
						}
						else{
							throw Error(throwError({statement,index,scope},"@ syntax", "cannot use '"+optionals[i]+"' symbol with '"+i+"'"));
						}
					}
				}
				{
					argsList=[operator,...args.flat()];
					instruction.args=argsList;
				}
				return {index,instruction};
			}
			async main_assembly({statement,index,scope}){//# tptasm
				({index}=contexts.keyWordList({statement,index,scope,keywords:{}}));
				let instruction,isArray;
				({instruction,isArray,index}=await this.generateAssemblyLine({statement,index,scope}));
				if(isArray)//instruction:AssemblyLine[]
					scope.label.code.push(...instruction);
				else //instruction:AssemblyLine
					scope.label.code.push(instruction);
				return {index};
			};
			async getLabel({statement,index,scope}){//#
				return (await contexts.expression_short({statement,index,scope})).toType(label);
			};
			getArg(value,level=0){//@:(string|Value|Operator)=>(string|Value)[]
				if(level>4)return [];//only allow 4 levels of assembly recursion
				return typeof value=="string"?value:
				typeof value=="number"?""+value:
				value instanceof Value?
					isNaN(value=value.toType("number").number)?
						NaN//Error("label is not assigned")
					:""+value
				:value instanceof Operator?this.doOperator(value,level+1)
				:[];
			};
			async compileAssemblyLine({instruction,cpuState,assemblyCode}){//@
				//asm -> tptasm
				let args=instruction.args;//(string|Value|operator)[]
				let failed=false;
				let tptasmString;
				if(args.length==1&& typeof args[0]=="number"){//for AssemblyLine<number> for: 'def let a=2;'
					args=["dw",args[0]];
				}
				{
					tptasmString=args
						.map((v,i)=>{v=this.getArg(v);failed||=(v!==v);return v+[""," "][+(i==0)]})
						.flat()
						.join("")
						.replaceAll(/-?\b([0-9]+)\b/g,(m)=>"0x"+(0x1fffffff&m).toString(16))
						//.map(v=>v==","?"":v)
						//.join(",")//:string
						//.replaceAll("%,", "r")//registers
						//.split(",")
					;
				}
				instruction.asmValue=tptasmString;
				{
					cpuState.lineNumber++;
					cpuState.jump++;
				}
				return {failed};
			};
		},
	};
	const contexts={
		//simple
			charSetMap:{
				"┘":0xdf,
				"└":0xe0,
				"┐":0xe1,
				"┌":0xe2,
				"─":0xd9,
				"│":0xda,
			},
			charSet:new Array(0x7f).fill().map((v,i)=>String.fromCharCode(i))+"█",
			string({index,statement,scope}){//is optional
				let word=statement[index];
				let value=Value.String(word);
				if(value){
					index++;
					return{index,value:value.string,array:value.array};
				}
				else return{index};
			},
			number_signs:{"+":v=>+v,"-":v=>-v,"*":v=>1*v,"/":v=>1/v},
			number({index,statement,scope}){//number is optional
				let sign="+";
				let oldIndex=index;
				let word=statement[index];
				if(contexts.number_signs.hasOwnProperty(word)){sign=word;index++;}
				let number=contexts.number_signs[sign](+statement[index]);
				if(!isNaN(number)){
					index++;
					return {index,value:number,sign};
				}else{
					return {index:oldIndex,value:undefined};
				}
			},
		//----

		capToIterator(number){//ban Infinity,NaN etc... //UNUSED
			if(number instanceof Value){
				number=number.toType("number").number;
			}
			return value-value!==0?0:value|0;
		},
		async main({statement,index=0,scope},part=0){//codeObj; Bash-like statements
			let codeObj=new Variable({name:"(code line)",type:"array"});
			let newScope=new Scope.CodeObj({fromName:"main",label:codeObj,parent:scope,code:statement});
			codeObj.scope=newScope;
			let state={void:false,static:false,virtual:false,phase:scope.defaultPhase};
			let wasUsed=false;
			statement.maxRecur;
			if(0){
				if(index==0){
					statement.recur??=0;
					statement.recur++;
				}else statement.recur??=1;
			}
			let word=statement[index];
			if(index>=statement.length
				 ||statement.recur>(statement.maxRecur??1)
			)return{index,value:newScope};
			//if(scope.label.code.length==0)
			parsing:{
				if(word==":"&&statement[index+1].match(/^\w+$/)&&(statement[index+2]??"").match(/^(;?)$/)){
					//'{:label;}' similar to `label:{break label}` in JS
					index++;//index => label name
					let word=statement[index];
					scope.label.labels[word]=scope.label;
					state.void=true;
					//TODO: add 'break', to be similar to the old compiler
					break parsing;
				}
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
				}
				commands:{
					word=statement[index];
					if(["repeat", "recur"].includes(word)){//repeat 10: recur 10:
						index++;
						const repeatingIndex_number=index;
						const calcReps=async()=>{
							let value;
							({index,value}=await contexts.expression_short({statement,index:repeatingIndex_number,scope}));
							if(value)value=value.toType("number").number;
							else value=0;
							return value-value!==0?0:value|0;
						}
						if(word=="repeat"){
							let maxReps=await calcReps();
							if(statement[index]==":")index++;
							let repeatingIndex=index;
							for(let i=0;i<maxReps;i++){
								maxReps=Math.min(maxReps,await calcReps());
								await contexts.main({statement,index:repeatingIndex,scope});
							}
							break commands;
						}
						else if(word=="recur"){
							const maxRecur=await calcReps();
							if(statement.maxRecur==undefined||maxRecur<statement.maxRecur){
								statement.maxRecur=maxRecur;
							}
							if(statement[index]==":")index++;
							//await contexts.main({statement,index,scope});
							//break commands;
						}
					}
					word=statement[index];
					//'keyword : arg' or 'keyword arg'
					if(["debugger", "import", "delete", "..."].includes(word)){
						wasUsed=true;
						if(word=="debugger"
							&&["", "$", "#"].includes(state.phase)
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
							&&["", "#"].includes(state.phase)
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
										if(labels.hasOwnProperty(i))delete labels[i];
									}
								}
								if(statement[index]!=","){//delete a,b,c ;
									break;
								}else{
									index++;
								}
							}
						}
						else if(word=="..."
							&&["", "#"].includes(state.phase)
						){
							({index}=await contexts.main_injectCode({index,statement,scope}));
						}
						else if(word=="import"
							&&["", "@", "$", "#"].includes(state.phase)
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
									const isInInstructionSet=assemblyCompiler.assembly.instructionSet.hasOwnProperty(word);
									if(["let", "def", "set"].includes(word)&&!isInInstructionSet)
										state.phase="#";
									else if(word&&(["undef", "ram"].includes(word)||word[0].match(/[a-zA-Z_]/)&&!isInInstructionSet))
										state.phase="$";
									else state.phase="@";
								}
								if(state.phase=="@")({index}=await contexts.main_assembly({statement,index,scope:newScope}));
								if(statement[index]=="$"){state.phase="$";index++;}
								if(state.phase=="$")({index}=await contexts.main_hidden({statement,index,scope:newScope}));
								if(statement[index]=="#"){state.phase="#";index++;}
								if(state.phase=="#")({index}=await contexts.main_meta({statement,index,scope:newScope}));
								;
								newScope.data_phase=state.phase;
							}
						}
						else if(!wasUsed&&(state.phase||state.void)){//set default phase '#;' '$;' '@;' 'void;'
							scope.defaultPhase=state.phase;
						}
						if(state.virtual)newScope.label.code.push(new HiddenLine.Void(virtualLine,{scope:newScope}));
					}
				}
			}
			if(0){
				statement.recur--;
				if(statement.recur==0){
					statement.maxRecur=undefined;
				}
			}
			if(!state.void){
				scope.label.code.push(...codeObj.code);//(codeObj);
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
				while(keywords.hasOwnProperty(word=statement[index])){
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
				if(!found)metaState["set"]=true;//'#: a=b;' ==> '#set: a=b;'
				for(let i=0;i<statement.length&&index<statement.length;i++){//'#let a,b,c;'
					let word;
					word=statement[index];
					if(endingStringList.includes(word)){break;}
					if(metaState["let"]){
						let value;
						({value,index}=await contexts.expression_short({statement,index,scope}));
						if(value){
							if(["name", "property"].includes(value.refType)){
								const newLabel=new Variable({name:value.name});
								let labelParent=value.refType=="name"?scope.let.label:value.parent;
								if(!["="].includes(statement[index])){//'let a;' ==> makes default label;
									if(metaState["set"]){
										labelParent.labels[value.name]??=newLabel;
									}else{
										labelParent.labels[value.name]=newLabel;
									}
								}
								else labelParent.labels[newLabel.name]=undefined;//allow writing to this new label;
								startValue=new Value({
									type:"label",
									label:newLabel,
									name:newLabel.name,
									parent:labelParent,
								});
							}else{
								startValue=value;
							}
						}
					}
					let value;
					({index,value}=await contexts.expression({statement,index,scope,startValue,includeBrackets:false}));
					if(metaState["def"]){//same as '$undef def set: obj;' ==> redefines and inserts code block;
						if(value instanceof Value && value.type=="label")
						if(value.label){//for '@null $def: label'
							value.label.unDefine();
							contexts.meta_defineLabelToNextLine(value.label,scope,value,{setAddress:true,insert:true},true);
							//scope.label.code.push(value.label);
							value.label.defs.push(scope.parent.label);
						}else{
							if(isStrict)throw Error(throwError({statement,index,scope}, "type", "label '"+value.name?.toString?.()+"' is undefined"));
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
				//state["undef"]=state["let"];
				//state["assign"]=state["let"];
				state["insert"]=state["def"];
				if(!found){//sets defaults
					state["undef"]=true;
					state["set"]=true;//'$set label;' assigns line number to labels
					state["insert"]=true;//'$def obj;' inserts code block into assembly
				}
				({value,index}=await contexts.expression_short({statement,index,scope}));
				if(value){
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
							let hasInsert=state["insert"];
							contexts.meta_defineLabelToNextLine(value.label,scope,value,{setAddress:true,insert:hasInsert});
							state["insert"]=false;
							if(value?.label)value.label.defs.push(scope.label);
						}
					}
					if(state["insert"]){//'$def label;' => inserts contence of label
						scope.label.code.push(value.label);
						if(value?.label)value.label.defs.push(scope.label);
					}
				}
				return{index};
			},
			meta_defineLabelToNextLine(label,scope,value,{insert=false,setAddress=true}={},useUnshift=false){
				//done in the line Assignment phase
				if(label==undefined)throw Error(throwError({scope},"", "label '"+value.name?.toString?.()+"' is not declared"));
				let newLineObj=new HiddenLine.Define({label,scope,insert,setAddress});
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
					let operator=new Operator(word,[startValue,value]);//:value[]
					word=statement[index];
					if(word&&("+-".includes(word)||word[0].match(/[0-9]/))){//'move->label+1;' or 'move->label 5;'
						({value,index}=await contexts.expression_short({statement,index,scope,startValue}));
						operator.push(value);
					}
					if(!assemblyCompiler.findPointerOrLabel(operator[0],null,scope)){
						throw Error(throwError({statement,scope,index},"#",
							operator[0].name?
							"'"+operator[0].name+"' is not a label or pointer"
							:"label or pointer undeclared"
						))
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
			async main_assembly(...args){return await this.main_assembly_0xmin(...args)},
			async main_assembly_0xmin({statement,index,scope}){//0xmin
				let ignoreChecker=false;//:bool
				({index}=contexts.keyWordList({statement,index,scope,keywords:{}}));//'@: 123;' or '@ 123;'
				if(statement[index]=="!"){ignoreChecker=true;index++;}//'!jump->10;' ignores cpuState checking
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
						codeObj.code.push(...Variable.fromValue(value).code);
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
						instruction.hasChecks=!ignoreChecker;
						if(instruction.args.length>0){
							useInstruction=true;
						}
						if(instruction.args.length==1&&typeof instruction.args[0]=="number"){
							instruction.binaryValue=codeObj.lineNumber=instruction.args[0];
							instruction.type="data";
						}else{
							instruction.type="command";
						}
						//if using no-instruction-set, then don't address pointers
						if(!assemblyCompiler.assembly.pointers["move"]){//BODGED
							instruction.type="data";
							//if(instruction.args[0].name)instruction.args[0].name+="_";
						}
					}
					if(useInstruction){
						codeObj.code.push(instruction);
					}
				}
				return {index};
			},
			async main_importFile({statement,index,scope,phase="#"}){
				//phase is used to get the file type
				let word;
				let filePath="";//:string;
				let fileName="";//:string; for debugging only
				getFilePath:{
					const fromTypes={
						"lib":compilerFolder+"../include/",
						"main":mainFolder,
						"this":mainFolder+(statement.data.file??"").match(/^[\s\S]*\/|/),
						"compiler":compilerFolder,
					};
					word=statement[index];
					if(fromTypes.hasOwnProperty(word)){
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
					if(files.hasOwnProperty(filePath)){
						fileData=files[filePath];//if file already exists, use it
					}else {
						let fileString=await oxminCompiler.fileLoader(filePath);
						fileData=bracketPass(parseFile(fileString,filePath,fileName));
					}
					if(statement[index]==":")index++;
					await evalBlock(fileData,undefined,scope,statement);
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
			const state={"let":false,"set":false,"def":false,"run":false,"codeof":false,"labelsof":false};
			let found;
			({index,found}=contexts.keyWordList({keywords:state,statement,index,scope}));
			if(!found){state["def"]=true;}
			let value;
			({index,value}=await contexts.expression_short({statement,index,scope}));
			const label=Variable.fromValue(value);
			if(label){
				if(state["let"]|state["labelsof"])Object.assign(scope.let.label.labels,label.labels);
				if(state["set"]|state["codeof"])scope.label.code.push(...label.code);
				if(state["def"]|state["run"]){
					const source=label.getCode_source();
					await evalBlock(source,undefined,scope,statement);
				}
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
						throw Error(throwError({index,statement,scope},"#", "trailing parameters are not supported yet."));
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
		endingSymbol({index,statement}){//failed==true if ending was found
			//'#()' or '#{}' ==> '()' '{}'
			//used to spit expresions e.g. '(){}'==>[function] '() #{}' ==> [expression,object]
			let failed=false;
			if("@$#".includes(statement[index])){
				if("([{".includes(statement[index+1]))index++;
				else failed=true;
			}if(endingStringList.includes(statement[index]))failed=true;
			return {index,failed:failed??index>=statement.length};
		},
		async arguments({index,statement,scope,callType,includeBrackets=true,argsObj=undefined}){
			//'(a, b, c) ::{} ::{}'
			//always includes brackets
			argsObj??={//:ArgsObj
				obj:{},//:{[name:String]:Value}
				list:[],//:Value[]
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
					if(!["::", "<:"].includes(statement[index]))break;
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
		async expression_short({index,statement,scope,argsObj=undefined,shouldEval=true,includeBrackets=false,noSquaredBrackets=false}){//a().b or (1+1)
			if(includeBrackets){statement=statement[index+1];index=0;}//assumes statement[index]=="("
			if(!statement[index])return{index};
			//shouldEval = true: can cause mutations, false: just needs to return where the expression ends.
			let word=statement[index];
			let value,array,failed;
			if(({index,failed}=contexts.endingSymbol({statement,index})).failed)return{index,failed};
			word=statement[index];
			if(word instanceof Array)throw Error ("compiler type error???: do not know how 'let word:Array;' is handled by the code");
			if(({index,value}=await contexts.number({index,statement,scope})).value!=undefined) {//'+123' or '-123'
				let number=value;
				if(shouldEval)value=new Value({number,type:"number"});
			}else if(({index,value,array}=await contexts.string({index,statement,scope})).value!=undefined) {
				//'"abc"'
				let string=value;
				if(shouldEval)value=new Value({string,type:"string",array});
			}else if(!({index,value,failed}=await contexts.delcareFunctionOrObject({index,statement,scope,shouldEval,startValue:value})).failed){}
			else if("([".includes(word)){//'(label)'
				({index,value}=await contexts.expression({index,statement,scope,includeBrackets:true,shouldEval}));
			}else if(contexts.operators_Left.hasOwnProperty(word)){//'!!label'
				const operator=contexts.operators_Left[word];//:function (Value) => Value
				index++;
				({index,value}=await contexts.expression_short({index,statement,scope,shouldEval,includeBrackets:false}));
				if(shouldEval)value=operator(value);
				return {index,value};
			}else if(word.match(nameRegex)){//'label'
				if(shouldEval){
					value=new Value();
					value.name=word;
					let {label,parent}=scope.findLabel(value.name)??{};
					value.label=label;
					value.parent=parent;
					value.refType="name";
				}
				index++;
			}else{
				//value=new Value();
				if(!TESTING)return {index,value:undefined};
			}
			return await contexts.expression_fullExtend({value,index,statement,scope,argsObj,shouldEval,noSquaredBrackets});
		},
		//test for function declaration: stops 'a = ()=>{}' turning into: ['a=()', '=>', '{}']
		//note: 'a = () = {}' ==> 'a=() = {}' ==> '(a=()) = ({})'
		//note: for functions it is advised to use '#(){}' instead of '(){}' to prevent this
		//expression_short:
			async getIndexedPropertyName({index,statement,scope}){
				let name,failed=false;
				({index,value:name}=await contexts.expression({index,statement,scope,includeBrackets:true}));
				if(name){
					if(name.type=="label"){
						if(name.refType=="symbol")name=name.label?.symbol??undefined;//'a[¬b]'
						else name=name.label?.lineNumber;
					}
					else if(name.type=="number")name=name.number;
					else if(name.type=="string")name=name.string;
					else{failed=true}
				}else failed=true;
				return {index,name,failed};
			},
			async expression_fullExtend({value,index,statement,scope,argsObj=undefined,shouldEval=true,noSquaredBrackets=false}){
				for(let i=index;i<statement.length;i++){//'.property'
					if(index>=statement.length)break;
					let word=statement[index];
					let oldIndex=index;
					if(word=="["&&noSquaredBrackets)break;
					({value,index}=await contexts.extend_value({index,statement,scope,value,argsObj,shouldEval}));
					if(index==oldIndex)break;
				}
				return{value,index};
			},
			async extend_value({index,statement,scope,value,argsObj=undefined,shouldEval=true}){//.b or [] or ()
				let word=statement[index];
				if([".", "..", "["].includes(word)){// 'a.' or 'a..' or 'a['
					if(value==undefined||value.type=="undefined"){
						//sets default labels from scopes
						//'(..b)' ==> 'this.b' var scope's label
						//'(.b)' and '(.(b))' ==> 'b' let scope's label
						//'([b])' ==> 'b'; weak scope's label
						if(word=="..")value=scope.var.label.toValue("label");
						if(word==".")value=scope.let.label.toValue("label");
						if(word=="[")value=scope.label.toValue("label");
					}
					let isInternal=word=="..";
					let parent=value.label;
					value=new Value({parent});
					let oldIndex=index;
					let name,nameFound=false;
					if(word!="["){index++;word=statement[index]??"";}
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
						throw Error(throwError({index,statement,scope},"index:`"+oldIndex+"` of '"+statement.join(" ")+"'"+" does not return a property name"));
					}else{
						value.name=name;
					}
					if(shouldEval)if(parent){
						if(isInternal){//'a..b';
							const label=getInternals(value,{index,statement,scope}).labels[name];//internal object
							if(label)({value}=await label.callFunction({args:undefined,value,scope,statement}));
						}//'a.b'
						else {
							if(typeof name=="string"||typeof name=="symbol")value.label=value.parent.findLabel(name)?.label;
							if(typeof name=="number"){//'a[b]'
								value.refType="array";
								if(name<0)name=name+(parent.code?.length??0);//a[]
								value.number=name;
								let newVal=parent.code[name];
								if(parent instanceof MachineCode){
									value=value.toType("number");
									//TODO: throw error if index out of range
									value.number=newVal.binaryValue;
								}
								else if(newVal instanceof AssemblyLine){
									let code=newVal;
									let number=(code.dataType=="char"?+code.args[1]:+code.args[0])|0;
									value=new Value({type:"label",label:new Variable({type:"number",lineNumber:number,name:"["+name+"]",code:[code]})})
									//
								}
								else value.label=
									newVal instanceof HiddenLine.Define&&newVal.insert?newVal.label:
									newVal instanceof Variable?newVal:
									newVal instanceof Scope?newVal.label:
									newVal instanceof CodeLine?undefined:
									newVal instanceof Statement?newVal.toLabel():
								undefined;
							}
						}
					}
					return {index,value};
				}else if("("==word&&//'foo()'; parses: 'foo=>()=>{}' ==> 'foo=>() => {}'; 'foo()=>{}' ==> 'foo ()=>{}'; 'foo=>#()=>{}' ==> 'foo => #()=>{}'
					!(statement[index+3]=="{"||functionCallTypes.includes(statement[index+3])&&statement[index+4]=="{")
					||(functionCallTypes.includes(word)&&statement[index+1]=="(")
				){
					//function call: 'foo()' to 'foo=>()::{}::{}'
					let startIndex=index;
					let callType="";
					if(functionCallTypes.includes(word)){
						callType=word;
						index++;
					}
					//'foo=>()=>{}' ==> 'foo => #()=>{}'let argsObj;
					({index,argsObj}=await contexts.arguments({index,statement,scope,callType,argsObj}));
					if(value.type=="label"&&value.label!=undefined){
						({value}=await value.label.callFunction({args:argsObj,value,scope,callType,statement}));
					}
					argsObj.obj={};
					argsObj.list=[];
					return {index,value};
				}else if(word==":>"){
					argsObj??=new ArgsObj({obj:{},list:[]});
					for(let i=index;i<statement.length;i++){
						if(statement[index]==":>"){//pipeLine
							index++;
							argsObj.obj[value.name]=value;
							argsObj.list.push(value);
							({value,index}=await contexts.expression_short({index,statement,scope,argsObj}));
						}else break;
					}
				}
				return {index,value};
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
					let functionObj={callType:""};//:Variable|temp object
					if(shouldEval){
						if(isExtension)functionObj=startValue.label;
						else functionObj=new MacroFunction({type:"function",});
						await contexts.parameters({index:0,statement:statement[index+1],scope,functionObj});
					}
					value=functionObj.toValue("label");
					index+=3;//skip '(' '...' ')' in '(...){}'
					word=statement[index];
					if(functionCallTypes.includes(word)){//e.g. '=>' in '()=>{}'
						functionObj.callType=word||functionObj.callType;//'(){} ()={}' ==> '()={}? ? ?' but '()={} (){}' ==> '()={}'
						index++;
					}
					word=statement[index+1];//word== '...' in '(){...}'
					let functionScope=new FunctionScope({fromName:"delcareFunctionOrObject/function",
						label:new Variable({name:"(scope function)",code:word}),
						parent:scope,
						code:word,
					});
					index+=3;
					functionObj.code.push(functionScope);
					functionObj.prototype??=new Variable({name:"(prototype)"});
					functionObj.supertype??=new Variable({name:"(supertype)"});
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
							,undefined//not recursive
						);
						value=startValue??new Value({type:"label",label:newScope.label});
					}
					index+=2;
					return {index,value,failed:false};//failed:isExtension&&!startValue};
				}else {
					return {index,value,failed:true};
				}
			},
		//---
		operators_Left:{
			"+":(value)=>value?value.toType("number"):new Value.Number(NaN),
			"-":(value)=>value?-value.toType("number"):new Value.Number(NaN),
			"~":(v)=>new Value.Number(~v?.number),
			"!":(v)=>{v??=new Value();let ans=v.toBool();ans.number=!ans.number;return ans;},
			//"...":(v)=>new Value.Number(~v.number),
		},
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
			"|":new Operator_numeric((a,b)=>a|b),
			"~":new Operator_numeric((a,b)=>~(a|b),0,a=>~a),

			">=":new Operator_numeric((a,b)=>a>=b),
			"<=":new Operator_numeric((a,b)=>a<=b),
			">":new Operator_numeric((a,b)=>a>b),
			"<":new Operator_numeric((a,b)=>a<b),

			"==":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+ Operator_bool.equality(v1,v2))),
			"!=":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+!Operator_bool.equality(v1,v2))),
			"===":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+ Operator_bool.strictEquality(v1,v2))),
			"!==":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+!Operator_bool.strictEquality(v1,v2))),
			//"!":new Operator_bool(v=>true,(b1,b2,v1,v2)=>new Value.Number(+!b2)),

			"&&":new Operator_bool(v=>v,(b1,b2,v1,v2)=>!b1?v1:v2),//bool1,bool2,value1,value2
			"||":new Operator_bool(v=>!v,(b1,b2,v1,v2)=>b1?v1:v2),
			"^^":new Operator_bool(v=>!v,(b1,b2,v1,v2)=>b1?v2:b2?new Value.Number(0):v2),//xor

			"...":{do({args,hasEquals}){//(args:mut Value[],bool)=>void, mutates args
				//concat operator
				let arg1=args.pop();
				let arg0=args.pop();
				if(arg0){//'a...b' 2 args
					let ans;
					switch(arg0.type){
						case"string"://ans:Value<string>
						arg1=arg1.toType("string");
						ans=new Value({
							type:"string",
							array:[...arg0.array,...arg1.array],
							string:arg0.string+arg1.string,
						});
						break;
						default://ans:Value<label>
						ans=new Variable({code:[
							...(arg0.toType("label").label?.code??[]),
							...(arg1.toType("label").label?.code??[]),
						]}).toValue("label");

					}
					args.push(ans);
				}else if(arg1){//'...a' 1 arg
					throw Error("compiler #operator error: '...a' aka spread operator is not supported yet");
					//args.push(...arg1); UNFINISHED
				}else{
					//no args -> silent error
				}
			}},
			"¬":{do({args,hasEquals}){//'¬a' to symbol/object UNFINISHED
				//e.g. 'a[¬b]'
				let rightArg=args.pop();//
				if(rightArg){
					rightArg.refType="symbol";//UNUSED
					args.push(rightArg);
				}
			}},
		},
		truthy(value){//(Value)=>bool
			"use strict";
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
				else if(["=", "<=>", "<->"].includes(word)){
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
							//let doAssignMent=0||firstArg.parent.labels.hasOwnProperty(firstArg.name);
							let newLabel;{
								//mutation
								newLabel=Variable.fromValue(value);
							}
							if(firstArg.type=="label"&&firstArg.parent){
								//overwrites variable 'a.b=2;' or 'a=2;'
								//refType:'property' | 'array' | 'name' | 'internal' | 'symbol'
								if(firstArg.refType=="array")firstArg.parent.code[firstArg.number]=newLabel;//
								else if(firstArg.refType=="internal"){firstArg.set(newLabel);}
								else if(firstArg.parent.labels.hasOwnProperty(firstArg.name))firstArg.parent.labels[firstArg.name]=newLabel;
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
						else if(word=="<=>"||word=="<->"){
							if(firstArg.type=="label"&&firstArg.label){//label:Variable
								let label=firstArg.label//firstArg.parent.labels[firstArg.name];
								if(word=="<=>"){//set object
									switch (value.type){
										case"label"://object,array,function
											label.labels={...(value.label?.labels??{})};
											label.code=[...(value.label?.code??[])];
											label.parameters=value.label?.parameters??[];
											label.callType=value.label?.callType??"";
											break;
										case"array":
										label.code=[...value.array];
										break;
										case"string":
										label.code=[...value.array];
										break;
									}
								}
								else if(word=="<->"){//set number
									label.lineNumber=value?value.toNumber().number:undefined;
								}
							}
							//UNFINISHED: needs code for array assignment
							args.push(firstArg);
						}
					}
					break;
				}
				//'foo(){}' or 'obj{}' extend function or object
				else if(args.length>0&&!({index,value}=await contexts.delcareFunctionOrObject({index,statement,scope,startValue:args[args.length-1],shouldEval})).failed){
					({value,index}=await contexts.expression_fullExtend({value,index,statement,scope}));
				}else if(word=="¬" && args.length>0){//extend value 'a+1¬.b'==> '(a+1).b'
					index++;let value=args.pop();
					({value,index}=await contexts.expression_fullExtend({value,index,statement,scope,shouldEval}));
					args.push(value);
				}else if(contexts.operators.hasOwnProperty(word)){//'+-*/'
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
		async main(label,logErrors){//(Variable) => Variable / MachineCode
			"use strict";
			const codeQueue=this.collectCode(label);//:CodeLine[]
			const {assemblyCode}=await this.assignMemory(codeQueue,label,logErrors);//:Variable
			//(Variable) -> Variable
			const machineCode=await this.compileAssembly(assemblyCode);//(Variable) -> MachineCode
			return machineCode;
		},
		//$ phase
			//code collection and memory assignment
			collectCode(variable,codeQueue){//collects assembly code
				codeQueue??=[];
				if(variable.isSearched){//silent error
					//throw Error(throwError({},"$",""))
					return codeQueue;
				}
				else variable.isSearched=true;
				let code=variable.code;
				for(let lineObj of code){//lineObj instanceof AssemblyLine
					///lineObj:CodeLine|Variable|Scope
					if(lineObj instanceof HiddenLine.Define && lineObj.insert){
						codeQueue.push(lineObj);
						lineObj=lineObj.label;
					}
					if(
						lineObj instanceof HiddenLine||
						lineObj instanceof AssemblyLine
					)codeQueue.push(lineObj);
					else if(lineObj instanceof Scope)continue;//lineObj=lineObj.label;
					else if(lineObj instanceof Variable){
						this.collectCode(lineObj,codeQueue);
						codeQueue.push(new HiddenLine.DefineReturn({label:lineObj,scope:lineObj.scope}));
					}
				}
				variable.isSearched=false;
				return codeQueue;
			},
			async assignMemory(codeQueue,label,logErrors){
				"use strict";
				logErrors??=true;
				if(!(codeQueue instanceof Array))throw Error("compiler type error: 'codeQueue' is not a normal Array.");
				if(!(label instanceof Variable))throw Error("compiler type error");
				let lastFails=codeQueue.length+1;
				let startingCpuState=new CpuState({relativeTo:label});
				let cpuState=new CpuState();
				const assemblyCode=new MachineCode();
				let passed=0;//has done a curtain number of reps
				passed=true;//ISTESTING
				for(let i=0;i<codeQueue.length;i++){
					let fails=0;
					let failList=[];//{i;instruction;failed}[]
					cpuState.setValues(startingCpuState);
					for(let i=0;i<codeQueue.length;i++){
						const instruction=codeQueue[i];
						let failed=false;//failed:bool|error|string; can contain part of error message
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
						//if(isNaN(cpuState.move+cpuState.jump)){fails??=Error("cpuState is NaN");break;}
						if(failed){
							fails++;
							failList.push({i,instruction,failed});
						}
						if(this.assembly.language=="0xmin"){
							cpuState.move=Math.max(0,cpuState.move);
							cpuState.jump=Math.max(0,cpuState.jump);
						}
					}
					if(fails==0&&i>=0&&passed>0)break;
					else if(fails==0)passed++;
					else if(fails>=lastFails){
						let instruction=failList[0].instruction;
						let failed=failList[0].failed;
						let reason=typeof failed== "boolean"?"unspecified reason":failed;
						if(logErrors)console.error("",reason);//,instruction.scope.getStack());
						throw Error(throwError({scope:instruction.scope}, "@", ": possibly uncomputable;"
							+"got: fails:"+fails+", i:"+i+";"
							+"reason: \""+reason+"\""
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
			async compileAssemblyLine_0xmin({instruction,cpuState,assemblyCode}){///:{failed:bool};
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
						failed||=(isNaN(arg)&&arg!=undefined?["@: argument is NaN",Error()]:false);//undefined or null are allowed to pass
						if(failed)break;
						let binaryArg;
						if(typeof arg=="number"){
							if(this.assembly.language=="0xmin"&&i==1&&instruction.type=="command"){
								//compile address; handles 0xmin quirks
								let isJump=instruction.args[0]?.name=="jump";
								binaryArg=(arg<0||1/arg==-Infinity)?(((2*(arg&1)*isJump-arg)&0xff)*0x10)|0x1000:(Math.abs(arg)&0xff)*0x10;
								binaryValue|=binaryArg;
								instruction.moveBy=arg|0;//Math.min(Math.max(arg|0??0,-0xff),0xff);
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
							if(arg==undefined||isNaN(arg)){
								failed=Error("argument was not defined");
							}
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
			async compileAssemblyLine(...args){return await this.compileAssemblyLine_0xmin(...args);},
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
				language:"0xmin",//"0xmin"|"tptasm"
				instructionSet_0xmin:{
					"null":0,
					"move":0,
					"jump":1,
					"nor":2,
					"red":3,
					"blue":4,
					"set":5,
					//
					"get":5,
					"set":11,
					"if":12,
					"xor":6,
					"and":7,
					"or":8,
					"get_jump":9,//'get jump -1' :9
					"or_input":10,
					"set_jump":13,//'set jump +3' :12
				},
				pointers:{},//:{pointerName:Pointer}
				registers:{

				},
				extraInstructions:{
					string_char   :0x20020000,//0x10??,
					string_pos    :0x20021000,//0x1???, //0x1yyx '\p00'
					string_col    :0x20022000,//0x20??, //background,textColor '\c0f'
					string_confirm:0x20010000, //0x20030000, '\a'
					input_emptyBuffer:0x20028000,
					hault:0x00000001,//'\h'
				},
				machineCodeArgs:[
					[0,4],
					[4,8],
					[12,1],
					[13,17],
				],//[starting bit number,length of argument (in bits)]
				setLanguage(language){
					let name;
					this.language=language;
					this.pointers={};
					this.pointers[name="ram"]=new Pointer("lineNumber");//memory location aka lineNumber
					switch(assemblyCompiler.assembly.language){
						case"0xmin":
						this.pointers[name="jump"]=new Pointer(name);//current instruction pointer
						this.pointers[name="move"]=new Pointer(name);//data pointer
						contexts.main_assembly=(...args)=>contexts.main_assembly_0xmin(...args);
						assemblyCompiler.compileAssemblyLine=(...args)=>assemblyCompiler.compileAssemblyLine_0xmin(...args);
						assemblyCompiler.assembly.instructionSet=assemblyCompiler.assembly.instructionSet_0xmin;
						break;
						case"tptasm":
						{//use R2
							this.pointers[name="jump"]=new Pointer(name);
							contexts.main_assembly=(...args)=>assembler.tptasm.main_assembly(...args);
							assemblyCompiler.compileAssemblyLine=(...args)=>assembler.tptasm.compileAssemblyLine(...args);
							assemblyCompiler.assembly.instructionSet={...assembler.tptasm.operators,...assembler.tptasm.otherKeywords,};
							//assemblyCompiler.nullValue.asmValue="dw 0";
						}
						default:
						{//empty instruction set '#"int";'
							//this.pointers[name="jump"]=new Pointer(name);
							contexts.main_assembly=(...args)=>contexts.main_assembly_0xmin(...args);
							assemblyCompiler.compileAssemblyLine=(...args)=>assemblyCompiler.compileAssemblyLine_0xmin(...args);
							assemblyCompiler.assembly.instructionSet={};
							this.language="0xmin";
						}
					}
				},
				init(){
					this.setLanguage(this.language);
				},
			},
			nullValue:null,//will be defined later
			findPointerOrLabel(value,cpuState,scope=undefined){//:HiddenLine|Pointer|Variable
				if(value instanceof HiddenLine){return value;}
				if(!(value instanceof Value))throw Error("compiler type error:");
				/// value:number|Value
				if(value.type=="number")
					return Variable.fromValue(value,scope);
				else if(value.type=="label"){
					let pointer=this.assembly.pointers[value.name]?.getState?.(cpuState);
					return pointer&&value.refType=="name"?pointer:value.label;
				}
				else throw Error(throwError({scope}, "$ type", "value must be a label or a number."));
			},
			async stateCheck({instruction,cpuState,assemblyCode}){
				if(this.assembly.language=="0xmin"){//check 'jump -> x' and 'jump x;' statements
					if(instruction.type=="command"
						&&instruction.args.length>=2
						&&instruction.args[0]?.name=="jump"
						&&instruction.hasChecks
						&&(instruction.args[1] instanceof HiddenLine.SetLabelOrPointer?
							instruction.args[1].operator?.[0]!=instruction.args[0]//does not check:'jump jump->label;' statements
							:true
						)
					){
						let address2=instruction.moveBy+instruction.cpuState.jump;
						let cpuState2=assemblyCode.code[address2]?.cpuState;
						if(!cpuState2){//allows jumping to unknown cpuStates
							if(0)return {failed:Error("could not find cpuState of location:"+address2)};
							else return {failed:false};
						}
						if(cpuState2&&cpuState2.move!=cpuState.move){
							return {failed:Error("cpuState miss-match, missing: 'move "+cpuState.move+" -> "+cpuState2.move+";'")};
						}
					}
					if(instruction.type=="command"
					){
						if(Math.abs(instruction.moveBy)>0xff){
							return {failed:Error("over jump. Attempting to moves by: "+instruction.moveBy)};
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
					if(this.assembly.instructionSet.hasOwnProperty(arg.name)){
						arg=this.assembly.instructionSet[arg.name];
					}
					else if(arg.type=="label"&&arg.label){
						arg=arg.label.lineNumber;
					}
				}else if(typeof arg=="string"){
					if(this.assembly.instructionSet.hasOwnProperty(arg)){
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
		async function evalDebugger({statement,index,scope,word=undefined,inputValue=undefined,string=undefined,cpuState=undefined}){
			let failed=false;
			word??=statement[index];
			if(word=="debugger"){//debugger name "label";
				if(statement[index]=="debugger")index++;//if done in '#' phase
				if(statement[index]==":")index++;//if done in '#' phase
				word=statement[index];
				if(!inputValue)if(!word.match(stringRegex)){//'debugger' =>  'debugger name' optional argument;
					let value;
					({value,index}=await contexts.expression_short({index,statement,scope}));
					if(value)inputValue=value;
					word=statement[index];
				}
				let value;
				string??=({value,index}=contexts.string({index,statement,scope})).value??"label";
				{
					const str = value??(
						!inputValue?"[[label]]":
						inputValue.type=="label"?"[[label]]":
						inputValue.type=="number"?"value.number":
						inputValue.type=="string"?"value.string":
						inputValue.type=="array"?"value.array":
						inputValue
					);
					const vm=require("vm");
					const sandbox = {log:"no log;",...{
						index,statement,scope,
						callStack,get stack(){return callStack.getData()},
						value:inputValue,label:inputValue?.label,
						cpuState,
						Value,
						Variable,MacroFunction,
						Scope,BlockScope,ObjectScope,MachineCode,
						CodeLine,AssemblyLine,HiddenLine,
						Internal,
					}};
					vm.createContext(sandbox);
					const code = "(async()=>log = ["+str+"\n])()";
					try{await vm.runInContext(code, sandbox);}catch(error){
						console.warn(error);
						throw Error(", Could not run the javascript. threw:{{'"+error+"'}}");
					}
					console.warn("debugger:",...sandbox.log)
				}
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
			data={};//?:{any:any}
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
		class ArgsObj extends DataClass{
			constructor(data){super();Object.assign(this,data??{})}
			list=[];//Value[]
			obj=[];//{[String]:Value}
		}
		class Value extends DataClass{
			constructor(data){super();Object.assign(this,data??{})}
			fromLabel(label){//UNUSED
				this.label=label;
				this.type="label";
				this.number=label.lineNumber;
			}
			type="label";//label|number|array|string; label == array == function
			label;//label Object
				name;//label name (from parent.labels)
				parent;//'parent.name' ==> label
				refType="property";//:'property' | 'array' | 'name' | 'return' | 'internal' ; 'a.b','a[b]','set a {b}', 'a..proto';
			array;//:(char|string)[] ; used with `value.string`
			string;
			number=0;//relAddress
			//for 'let value;'
			allowedLet=false;
			get array(){return this.label?.code;}//code ///arry: Variable|CodeLine; from: Variable.prototype.code
			set array(val){(this.label??=new Variable()).code=val;}
			static Number=//Value.Number
			class Number extends Value{constructor(number,data={}){super({number,type:"number",...data});}}
			static String=//Value.String
			function Value_String(rawString){//:Value.String?
				if(rawString&&"\"'`".includes(rawString[0])){
					let includeAllWhiteSpace=rawString[0]=="`";
					let array=rawString.substr(1,rawString.length-2)//(string|char)[]
						.replaceAll("\\t", "\t")
						.replaceAll("\\n", "\n")
						.replaceAll("\\r", "\r")
						.replaceAll(/\\u(....)/g,(v,v1)=>String.fromCharCode(+v1||0))
						.replaceAll(/\\x(..)/g,(v,v1)=>String.fromCharCode(+("0x"+v1)||0))
						.replaceAll(/\\([^cpha])/g,"$1")
						.match(/\\[cp][\s\S]{2}|\\[ha]|[\s\S]/g)//color'\c00',position'\p000',accept/confirm '\a',hault'\h'
					;
					array=(array??[])//:string[]
						.map(v=>v in contexts.charSetMap?String.fromCharCode(contexts.charSetMap[v]):v)
					;
					let string=rawString
						.replaceAll(/(?<!^|\\)["](?!$)/g,"\\\"")
						.replaceAll(/\\(['`])(?!$)/g,"$1")
						.replaceAll(/^["'`]|["'`]$/g,"\"")
						.replaceAll(/\\[cp]/g, "\\x")
						.replaceAll(/\\[ha]/g,"\n")
						.replaceAll(/\\([^cpha])/g,"$1")
						.replaceAll(/\\ /g," ")
						.replaceAll(/\\x(..)/g, (v,m1,i,a)=>(10000+(+("0x"+m1))+"").replace(/^./,"\\u"))
						.replaceAll(/\n/g,includeAllWhiteSpace?"\\n": "")
						.replaceAll(/\t/g,includeAllWhiteSpace?"\\t": "")
					;
					string=JSON.parse(string);
					return new Value({type:"string",string,array});
				}else{
					return undefined;
				}
			}
			//Value.prototype.toNumber
			toNumber(value=this){//to number type
				let mask=(assemblyCompiler.assembly.language=="tptasm"?0xffff:0xffffffff);
				let number;//:number
				if(value.type=="number"){number=value.number}
				else if(value.type=="label")number=value.label?.lineNumber;
				else if(value.type=="string")number=mask&(value.array?valueCharToNumber(value.array[0],true):valueCharToNumber(value.string[0],true));
				else if(value.type=="array")throw Error("compiler error: the array Value-type is not fully supported yet.");
				return new Value.Number(number);
			}
			toBool(value=this){
				let bool;
				switch(value?.type){
					case"number":bool=!!value.number;break;
					case"string":bool=!!value.toType("number").number;break;
					case"label":bool=!!value.label;break;
					case"array":bool=!!value.toType("number").number;break;
					default:bool=false;
				}
				return new Value.Number(bool);
			}
			toValueString(value=this){//:Value
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
				return new Value({type:"string",string,array:[...(string??"").split("")]});
			}
			toType(type){
				switch(type){
					case"number":return this.toNumber();break;
					case"string":return this.toValueString();break;
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
			get ram(){return this.lineNumber};//only for '$debugger "cpuState.ram";'
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
			static Number=class Number extends AssemblyLine{//UNUSED: not used yet
				constructor(number) {
					super({args:[number],binaryValue:number});
				}
				type="data";
			}
			//binaryValue is the final value of this line of code.
			//also used in meta (#) phase represent the value.
			type="data";//: 'data' | 'command'
			args=[];//:(Value|HiddenLine|number)[];
			binaryValue=undefined;//:number
			dataType=undefined;//?: 'number' | 'char'; optional used with e.g.'String.char(5)' in '"text";'
			get command(){throw Error("compiler error:@ command is obsilete")};//
			get data(){throw Error("compiler error:@ data is obsilete")};
			cpuStateAfter;//:CpuState; the cpuState after this line is run;
			moveBy;//:number; relAddress part of instruction. used for state checking
			hasChecks=true;
		}
		class R2Line extends CodeLine{
			constructor(data){super();Object.assign(this,data??{})}
			binaryValue;//:number
			asmValue;//:string
			args=[];//:(string|Value)[]
			operator;//:Operator<Value|string>
			operatorIndex;//:number
		}
		///@abstract
		class HiddenLine extends CodeLine{
			//contains
			run({lineNumber,scope,cpuState}){return {lineNumber,failed:false};}
			static Define=
			class Define extends HiddenLine{//'$set a;'
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				setAddress=true;
				insert=false;
				run({cpuState}){//nextlineNumber
					this.label.lineNumber=cpuState.lineNumber;
					this.label.cpuState=new CpuState(cpuState);
					return{failed:false,relAddress:this.label.lineNumber};
				}
			}
			static DefineReturn=
			class DefineReturn extends HiddenLine{//'$set return;' done when a scope ends 
				constructor(data){super();Object.assign(this,data??{})}
				label=null;///:Variable
				run({cpuState}){//nextlineNumber
					this.label.returnLineNumber=cpuState.lineNumber;
					this.label.returnCpuState=new CpuState(cpuState);
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
				run({cpuState,jumpLimit=Infinity}){///: {failed:boolean;relAddress:number}
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
							let newLineNumber;
							if(this.operator[1].type=="number"){//'$jump->5;'
								newLineNumber=this.operator[1].number+cpuState.lineNumber;
							}
							else{//'$jump->label;' or '$label->jump'
								args[1]=assemblyCompiler.findPointerOrLabel(this.operator[1],cpuState,this.scope);
								if(!args[1])return {relAddress:NaN,failed:Error("compiler error: $: args[1] is not defined: '"+this.operator[1].name+"'")};
								let addAddress=0;
								if(this.operator[2]){//'$jump->label+1;'
									args[2]=assemblyCompiler.findPointerOrLabel(this.operator[2],cpuState,this.scope);
									addAddress=args[2]?.lineNumber??0;
								}
								newLineNumber=args[1].lineNumber+addAddress;
							}
							returnValue=newLineNumber-args[0].lineNumber;
							if(isAssigning)args[0].lineNumber=newLineNumber;
							failed||=isNaN(returnValue)?Error("$: relative address is NaN"):false;
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
				type="label";//:"label"|"string"|"number"|???
			//as object
				//names: [value],(compiler generated/inbuilt),<instance>,{important inbuilt constant},pointer*
				name=undefined;///@string
				labels={};//aka properties
				static objectNum=0;
				symbol=Symbol(Variable.objectNum++);
				prototype=null;///instanceof Variable
				supertype=null;///instanceof Variable
				securityLevel=0;//used with '..secure'
			//as array
				code=[];//:(CodeLines|Variable|Scope)[]
			//as function
				callType="";//:'' | '=>' | '=' | '->' | '<-' etc...
				parameters=[];//:Parameter[]
				scope=null;//the scope that the code should be called with. the scope contains the code
				functionPrototype=null;//:Variable
				functionSupertype=null;//:Variable
				functionConstructor;
			//as assembly
				returnLineNumber;//:number; defined in collectCode
				returnCpuState;//:CpuState
				relAddress=0;//number UNUSED
				lineNumber=undefined;
				cpuState;//:CpuState
				defs=[];//:Variable[]; for removing def's of a label. stores places where '$def this;' and '$set this;' are used: '#undef: this;'
				//defineLine=null;//instanceof AssemblyLine
			//----
			get address(){//UNUSED
				const address=this.defineLine?.address;
				return address==undefined?undefined:address+this.relAddress;
			}
			isSearched=false;
			getCode_source(){//:Statement
				if(this.scope){///this.scope:Scope|Scope.CodeObj;
					//this: 0xminObject
					//this.scope comes from 'obj{}' with 'obj{}()'
					if(this.scope instanceof Scope.CodeObj)return new bracketClassMap["{"](this.scope.code.data,[this.scope.code]);//'{;}'
					else if(this.scope instanceof FunctionScope)return this.scope.code;//'{{}}'
					else if(this.scope instanceof Scope)return this.scope.code;//'{{}}' this.scope.code
					else {console.error(this.scope?.constructor);throw Error("compiler type error:");}
					return codeBlock;
				}
				else{//this: MacroFunction
					const code=new bracketClassMap["{"]();
					this.getCode().forEach(v=>code.push(...v.code));
					return code;
				}
			}
			getCode(n=0){//: Statement; can contain Scope
				let codeBlock;//(Statemnent)
				if(this.isSearched)return codeBlock;
				this.isSearched=true;
				this.code.reduce((s,v)=>{
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
			static middleScopeCode;
			async callFunction({args,value:callingValue,callType,scope,statement}){//:{value}
				args??={obj:{},list:[]};
				//args: {obj;list}
				//args.obj: {[key:"string"]:Value}
				//args.list: Value[]
				callType||=this.callType;//'foo()={};', 'foo()' ==> 'foo=()'
				const argsObj=new Variable({
					name:"(argument object)",
					labels:{},
					code:[]
				});
				for(let i=0;i<args.list.length;i++){
					let label=Variable.fromValue(args.list[i]);
					if(i<this.parameters.length){
						argsObj.labels[this.parameters[i].name]=label;
					}
					argsObj.code.push(label);
				}
				let codeBlock=this.getCode();//new code instance
				const newLabel=new Variable({name:"<"+this.name+">"});
				const middleLabel=new Variable({name:"(function vars)"});
				const middleScope=new Scope({//allows function to use arguments without them being part of the instance object
					label:middleLabel,
					code:(Variable.middleScopeCode??=new Statement()),//:Statement 
					parent:this.scope??globalScope
				});
				let instanceScope=new Scope({//weak scope
					fromName:"callFunction",
					parent:middleScope,
					label:newLabel,
					code:codeBlock
				});
				let returnObj=newLabel;
				switch(callType){
					case"="://class
					instanceScope.let=instanceScope;
					instanceScope.var=instanceScope;
					newLabel.functionPrototype=this.prototype;
					newLabel.functionSupertype=this.pupertype;
					middleLabel.labels["this"]=newLabel;
					middleLabel.labels["return"]=newLabel;
					middleLabel.labels["arguments"]=argsObj;
					middleLabel.labels["constructor"]=this;
					Object.assign(middleLabel.labels,argsObj.labels);
					break;//pure, unpure, 
					case"=>"://arrow function
					instanceScope.let=instanceScope;
					Object.assign(middleLabel.labels,argsObj.labels);
					break;
					case"<="://'using(){}'
					instanceScope.let=instanceScope;
					instanceScope.var=instanceScope;
					instanceScope.parent=globalScope;//instanceScope;
					newLabel.labels["this"]??=callingValue.parent;
					break;
					case"<-"://'macro(){}'
					instanceScope.parent=scope;//instanceScope;
					newLabel.labels["block"]??=scope.label;
					newLabel.labels["scope"]??=scope.label;
					break;
					case"->"://'weak(){}' impure function
					instanceScope.let=scope.let;
					instanceScope.var=scope.var;
					middleLabel.parent=middleLabel;//instanceScope;
					break;
					default:
					instanceScope.let=instanceScope;
					middleLabel.labels["arguments"]=argsObj;
					middleLabel.labels["constructor"]=argsObj;
					middleLabel.labels[globalScope.symbol]=middleLabel;
					Object.assign(middleLabel.labels,argsObj.labels);
					middleLabel.labels["this"]=callingValue.parent??scope.var.label;
					middleLabel.labels["return"]=returnObj;
					newLabel.labels["caller"]??=scope.label;
				}
				for(let codeScope of codeBlock){
					if(callType!="<=")middleScope.parent=codeScope;
					if(codeScope instanceof Scope.CodeObj)
						await contexts.main({statement:codeScope.code,scope:instanceScope});
					else await evalBlock(codeScope.code,undefined,instanceScope,statement);
				}//await evalBlock(codeBlock,undefined,instanceScope,statement);
				//if no return label created, it returns the 
				let newReturnObj=middleLabel.labels["return"];//by default, returns newLabel
				if(newReturnObj===undefined)newReturnObj=newLabel;
				return {value:new Value({type:"label",label:newReturnObj})};
			}
			//Variable
			findLabel(name){//'a.b' string=>{parent:Variable,label:Variable}
				return (//null can be used for empty place-holder labels, undefined can be use for 'let' statements
					this.functionSupertype?.findLabel?.(name)
					??(this.labels.hasOwnProperty(name)&&this.labels[name]!==undefined?{label:this.labels[name],parent:this}:undefined)
					??this.functionPrototype?.findLabel?.(name)
				);
			}
			unDefine(){//'$undef label'; done in '#' phase
				//defs:Variable[]
				for(let i=0;i<this.defs.length;i++){
					let code=this.defs[i].code;
					let index=code.indexOf(this);
					if(index==-1)
						for(let i=0;i<code.length;i++)
						if(code[i] instanceof HiddenLine.Define&&code[i].label==this)index=i;
					;
					if(index!=-1)code.splice(index,1);

				}
				this.defs=[];
				//this.lineNumber=undefined;
				return this;
			}
			getNumber(){return this.lineNumber;}
			getString(){return this.code.reduce((str,code)=>str+(code instanceof Variable?code.getString():code instanceof AssemblyLine?String.fromCharCode(+code.args[1]|0)??"" : ""), "")}
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
			static String=
			class String extends Variable{
				constructor(string,data){
					"use strict";
					let newObj=new Value({type:"string",string}).toType("label");
					Object.assign(newObj,data??{});
				}
			};
			static fromValue(value,scope=undefined){//label|number|array|string
				if(value?.type=="label")
					return value.label;
				if(scope!==null)scope??=globalScope;//BODGED
				if(value?.type=="number"){
					return new Variable({
						type:"number",
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
				constructor(name,foo,data){super(data??{});this.run=foo;this.name="{"+name+"}";}
				run=({value,args})=>new Value();
				async callFunction({args={},value:callingValue,scope}){
					//args: {obj;list}
					//args.obj: {[key:"string"]:Value}
					//args.list: Value[]
					return {value:await this.run({
						args:args.list,//:Value[]
						label:callingValue.parent,//:Variable
						value:callingValue,//:Value parent
						scope//:Scope
					})};
				}
			}
			class BuiltinFunctionFunction extends BuiltinFuntion{
				constructor(name,foo,data){//'a..b(1,2);'
					super(name,()=>{},data);
					this.name+="*";//{name}* ==> 'pointer to an inbuilt'
					this.#functionAsValue=new BuiltinFuntion(name,foo).toValue("label");
				}
				#functionAsValue;//:const Value<label>
				async callFunction({args={},value:callingValue,scope}){
					this.#functionAsValue.parent=callingValue.parent;
					return {value:this.#functionAsValue};
				}
			}
			class InternalValue extends Value{
				constructor({label,name},propertyName){
					super({parent:label,label:label[propertyName],name});//{parent,name}
					this.#propertyName=propertyName;
				}
				//parent;
				//name;
				type="label";//: const
				refType="internal";//: const
				#propertyName;//: string
				get(){//UNUSED
					return this.parent[this.#propertyName];
				}
				set(label){
					this.parent[this.#propertyName]=label;
				}
			};
			const Internal=new (class extends Variable{
				constructor(){
					super();
					for(let i in this.labels){
						if(this.labels.hasOwnProperty(i)&&!(this.labels[i] instanceof BuiltinFuntion))
							this.labels[i]=new BuiltinFuntion(i,this.labels[i]);
					}
				};
				labels={//'a..b'
					///(Variable)=>Value
					//"foo":({label,value,scope})=>new Value({type:"number",number:2}),
					"length":async({label})=>new Value.Number(label.code.length),
					"code":async({label})=>new Variable({name:"(..code)",//BODGED
						code:label.getCode().map(v=>Variable.fromValue(new Value({type:"string",string:v+""}))),
					}).toValue("label"),
					"splice":new BuiltinFunctionFunction("splice",async({label,args,value})=>{
						args[0]??=new Value.Number(0);
						args[1]??=new Value.Number(0);
						args[2]??=new Variable().toValue("label");
						args=[args[0].toNumber().number,args[1].toNumber().number,Variable.fromValue(args[2]).code];
						if(args[0]<0)args[0]+=label.code.length;//'a[-1]' => 'a[a..length-1]'
						label.code.splice(args[0],args[1],...args[2]);
						return label.toValue("label");
					}),
					"array":async({label})=>new Variable({name:"(..array)",code:label.code}).toValue("label"),
					"labels":async({label})=>{
						let list=Object.getOwnPropertyNames(label.labels);
						return new Value({type:"array",array:list,number:list.length});
					},
					"compile":async({label})=>{
						let value;
						try {value=(await assemblyCompiler.main(label,false)).toValue("label");}
						catch(e){value= new Value.String(e);}
						return value;
					},
					//note: name might change
					"code_assembly":async({label})=>await assemblyCompiler.collectCode(label).toValue("label"),
					//change object state
						"seal":async({label})=>{Object.seal(label.labels);Object.seal(label.code);return label;},
						"freeze":async({label})=>{Object.freeze(label.labels);Object.freeze(label.code);return label.toValue("label");},
						"secure":async({label})=>{//does not need 'recur' to call a secure function
							throw Error("'label..secure' is not supported yet.");
							Object.freeze(label.code);
							label.securityLevel=1;
							return label;
						},
					"this":async({label})=>label.toValue("label"),
					"return":async({label})=>(label.returnLabel??=new Return(label)).toValue("label"),
					//from this object
					//`obj.prototype`
						"prototype":async({label})=>new InternalValue({label,name:"prototype"},"prototype"),
						"supertype":async({label})=>new InternalValue({label,name:"supertype"},"supertype"),
					//from parent function
					//`obj.constructor`
					"construtor":async({label})=>new InternalValue({label,name:"construtor"},"functionConstructor"),
						"proto":async({label})=>new InternalValue({label,name:"proto"},"functionPrototype"),
						"super":async({label})=>new InternalValue({label,name:"super"},"functionSupertype"),
					//other
					"defs":async({label})=>new Variable({name:"defs",code:label.defs,lineNumber:label.defs.length}).toValue("label"),
					"indexOf":new BuiltinFunctionFunction("indexOf",async({label,args})=>{
						let ans;
						if(!args[0].label)ans=-1;
						else ans=label.code.indexOf(args[0].label);
						return new Value.Number(ans);
					}),
					//convert string to number
					flat:async({label})=>{
						const symbol=Symbol();
						function* forEachStatement(statement){
							for(let word of statement){
								yield word;
								if(word instanceof Statement){
									yield* forEachStatement(word);
								}
							}
						};
						function* forEachLabel(label){
							if(label[symbol])return;
							label[symbol]=1;
							let label1;
							for(let label1 of label.code){
								if(label1 instanceof Variable){
									yield label1;
									yield* forEachLabel(label1);
								}
								if(label1 instanceof Statement){
									yield label1.toLabel();
									yield* forEachStatement(label1);
								}
							}
							delete label[symbol];
						};
						return new Variable({
							type:"array",
							name:"(flat)",
							code:forEachLabel(label),
						}).toValue("label");
					},
					"asNumber":async({label})=>new Value.Number(+label.toValue("string").string),
				};
			});
		//----
		function getInternals(value,{index,scope,statement}){//:Variable
			return new Variable(Internal);
		}
		function valueCharToNumber(value,join=false){
			let v=value;
			let ary=[
				v.length==1?assemblyCompiler.assembly.extraInstructions.string_char
				:v[1]=="x"?assemblyCompiler.assembly.extraInstructions.string_char
				:v[1]=="p"?assemblyCompiler.assembly.extraInstructions.string_pos
				:v[1]=="c"?assemblyCompiler.assembly.extraInstructions.string_col
				:v[1]=="a"?assemblyCompiler.assembly.extraInstructions.string_confirm
				:v[1]=="h"?assemblyCompiler.assembly.extraInstructions.hault
				:0,
				v.length==1?v.charCodeAt(0):+("0x"+v.substr(2))||0,
			];
			return join?ary[0]|ary[1]:outputAsBinary()?ary:["dw", "0x"+((ary[0]|ary[1])&0xffff).toString(16)];
		}
		function valueStringToArray(value,scope){
			if(value?.type=="string")
			return new Variable({
				name:"<(string)>",
				type:"string",
				code:(value.array??value.string.split("")).map(v=>new AssemblyLine({
					type:"data",
					dataType:"char",
					args:valueCharToNumber(v),
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
			get cpuState(){return this.label.returnCpuState;}
			set cpuState(val){this.label.returnCpuState=val;}
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
			getState(cpuState){//
				if(cpuState)this.cpuState=cpuState;
				return this;
			}
			get lineNumber(){if(this.cpuState)return this.cpuState[this.name];}
			set lineNumber(value){if(this.cpuState)this.cpuState[this.name]=value;}
			setState(cpuState){
				if(!(cpuState instanceof CpuState))throw Error("compiler type error");
				cpuState[this.name]=this.lineNumber;
			}
		}
		class MachineCode extends Variable{
			//code:AssemblyLine[];
			constructor(data){super();Object.assign(this,data??{});}
			asBinary(){
				return this.code.map(v=>v.binaryValue);
			}
			asAssembly(){
				return this.code.map(v=>v.asmValue);
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
			made=Error();//for debugging
			fromName;//for TESTING only
			label=null;//label that owns this scope, label contains properties.
			//scopes
				parent=null;
				var=null;
				let=null;
			//----
			isSearched=false;
			code;//: bracketClassMap["{"];
			//temp variables
				//settings={banJS:false,banInfiniteLoops:false,};
				defaultPhase;//: "#" | "$" | "@"; only exists in evalBlock
			//line data, for debugging code only
				data_phase;//: "#" | "$" | "@";  main()
			getStack(getdata=(s)=>[s.code.data?.line+1,s.label.name],stack=[]){
				if(1){//OBSILETE
					if(this.isSearched)return stack;
					this.isSearched=true;
					stack.push(getdata(this,this.label.name));
					this.parent.getStack(getdata,stack);
					this.isSearched=false;
					return stack;
				}
			}
			//scope
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
				//if(this.label.labels.hasOwnProperty(name))return this.label;
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
				//
				//#set 0xmin.settings.log_code=1;
				//#set 0xmin.settings.log_table=1;
				//#set 0xmin.settings.language("tptasm");
				//#set 0xmin.settings.language("0xmin");
				//#set 0xmin.settings.model="R216K2A";
				this.mainObject=mainObject;
				this.label.prototype=mainObject;
				this.label.labels={"0xmin":mainObject};
			}
			mainObject;
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
		class Language{//TODO: put languages in separate files
			static langs={};//{langName:Language}
			static currentLang;//:Language
			pointers=[];//:String[]
			parse=({statement,index,scope})=>{}
			compile=({instruction,cpuState,assemblyCode,code})=>{}
			instructionSet=[];
			constructor(data){
				"use strict";
				Object.assign(this,data??{});
			}
		}
	//----
	//functions
		async function evalBlock(block,parentScope=undefined,scope=undefined,calledFrom=undefined){
			//does not include brackets
			///block:code tree|Scope[]
			///parentScope?:Scope
			///scope?:Scope|Variable
			///calledFrom?:Statement, used to retect recursion
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
						callStack[0]??=block;
					}
				}else{
					scope=new BlockScope({fromName:"evalBlock",parent:parentScope,code:block});
				}
				if(label)scope.label=label;
			}
			scope.defaultPhase="";
			const symbol=calledFrom?.symbol;
			for(let i=0;i<block.length;i++){
				let statement=block[i];
				const checkRecur=!!calledFrom&&calledFrom.symbol>=statement.symbol;
				const recur=statement.recur;
				handleRecursion:if(checkRecur){
					///calledFrom:Statement
					recur[symbol]??=0;
					recur[symbol]++;
					if(recur[symbol]>(statement.maxRecur??1)){
						//reached recursion cap
						continue;
					}
					callStack.push(statement);
				}
				await contexts.main({statement,scope});
				if(checkRecur){
					recur[symbol]--;
					if(recur[symbol]==0)delete recur[symbol];
					callStack.pop();
				}
			}
			scope.defaultPhase="";
			return scope;
		}
		async function evalAssembly(scope){
			let assemblyCode=await assemblyCompiler.main(scope.label);
			return assemblyCode;
		}
	//----
	{
		//0xmin label name conventions:
		//info about Variable naming, can also be found in the variable class.
		//names: [value],(compiler generated/inbuilt),<instance>,{important inbuilt constant},{pointer}*
		//name* ==> pointer
		//{name}* ==> inbuilt function that returns another inbuilt object/function called 'name'
		//<name> ==> instance of 'name'
		//{name} ==> inbuilt object or function
		//[name] ==> value, (normally a number i.e. `new Variable.fromValue(new Value.Number(name))` )
		//name ==> normal variable
		const nullValue=assemblyCompiler.nullValue=new AssemblyLine({
			type:"undefined",
			args:[new Value({type:"label",name:"null",})],
			binaryValue:0,
			scope:"null's scope",
			asmValue:"dw 0",
		});
		assemblyCompiler.assembly.init();
		Object.doubleFreeze(nullValue);
	}
	const mainObject=new Variable({name:["0xmin"],lineNumber:0,labels:Object.freeze({
		"null":Object.doubleFreeze(Object.assign(Variable.fromValue(new Value.Number(0),this),assemblyCompiler.nullValue)),
		"settings":Object.seal(new Variable({
			name:"settings",
			labels:Object.seal({
				"log_code":new Variable({name:"log_code",lineNumber:0}),//:1|0
				"log_table":new Variable({name:"log_table",lineNumber:0}),//:1|0
				"log_length":new Variable({name:"log_length",lineNumber:0}),//:1|0
				"model":new Variable({name:"model",lineNumber:0}),//:1|0
				"language":new BuiltinFuntion("language",({args})=>{
					if(args[0]){//args[0]:Value
						let str=args[0].toType("string").string;
						if(["tptasm", "0xmin"].includes(str)){
							assemblyCompiler.assembly.setLanguage(str);
						}
					}
					return new Value.String(assemblyCompiler.assembly.language);
				}),//:1|0
			}),
		})),
		"Math":Object.doubleFreeze(new class MathObj extends Variable{
			constructor(){
				super({name:"Math"});
				for(let i in Math){
					if(Math.hasOwnProperty(i)){
						this[i]=new BuiltinFunctionFunction(i,
							({args})=>new Value.Number(Math[i](...(args.map(v=>v.toType("number").number))))
						,{});
						Object.doubleFreeze(this[i]);
					}
				}
				Object.doubleFreeze(this.labels);
			}
		})
	})});
	//'{' ==> '{ ... }'
	let globalScope;
	let compileData={model:"R216K2A"};
	const callStack=[];
	callStack.getData=function(){
		return [...this.map(v=>["l:"+(v.data.line+1),...v.map(v=>typeof v=="string"?v:"_")].join(" "))];
	};
	let outputAsBinary=()=>assemblyCompiler.assembly.language=="0xmin";
	let parts=inputFile;
	parts=parseFile(parts,fileName);
	parts=bracketPass(parts);
	parts=await evalBlock(parts);
	parts=await evalAssembly(parts);
	//chars->words->expression->statement->codeObj->block
	//
	let outputFile=outputAsBinary()?parts.asBinary():parts.asAssembly();
	let outputBinary=outputAsBinary()?new Uint32Array(outputFile):
		"_Model \""+compileData.model+"\"\n"//R216K2A
		+"%include \"common\"\n"
		+"start:\n\t"
		+outputFile.join("\n\t");
	const fillText=(txt,len,space=" ",map=(t,s)=>t+s)=>map(txt,space.repeat(len-txt.length));
	const hex30ToStr=(v,len=8)=>{v=(v|0).toString(16);return "0".repeat(len-v.length)+v;};
	const decToStr=(v,len=3)=>" ".repeat(Math.max(len,(""+NaN).length)-(v+"").length)+v;
	const outputAsString=()=>outputFile.map(v=>(((1<<31)-1)&v).toString(16)).map(v=>"0".repeat(8-v.length)+v);
	let highestLen=parts.code.reduce((s,v)=>Math.max(v.asmValue?.length|0,s),0);
	const outputLogTable=()=>
		parts.code.map((v,i)=>({//v:AssemblyLine
			cpu:(v.cpuState??new CpuState).data().map(v=>hex30ToStr(v)),
			data:hex30ToStr(v.binaryValue),
			asm:fillText(v.asmValue??"",highestLen),
			lineNumber:i,
			sourceLineNumber:1+v.scope?.code?.data?.line,
			line:(v.scope?.code?.data?.getLines()[v.scope?.code?.data?.line]??"")
		}))
		.map(v=>""
			+"line:"+hex30ToStr(v.lineNumber,Math.ceil(Math.log2(parts.code.length)/4)|1)
			+(
				assemblyCompiler.assembly.language=="0xmin"?
					" data:"+v.data
					//+"  ram:"+v.cpu[0]
					+" jump:"+v.cpu[1]
					+" move:"+v.cpu[2]
					+" cmd:"+null
				:assemblyCompiler.assembly.language=="tptasm"?
					" asm:"+v.asm
				:""
			)
			+";"
			+" src:"+decToStr(v.sourceLineNumber,(Math.log10(highestSourceLineNumber)|0)+1)+"| "+v.line
		).join("\n")
	;
	let settingsObj=globalScope.mainObject.labels["settings"].labels;//:Variable().labels
	if(settingsObj["log_length"].lineNumber||settingsObj["log_code"].lineNumber||settingsObj["log_table"].lineNumber){
		console.log(
			"len("+outputFile.length+")"+
			(settingsObj["log_code"].lineNumber||settingsObj["log_table"].lineNumber
				?":":""
			),
			""
			+(settingsObj["log_code"].lineNumber?outputAsString():"")
			+(settingsObj["log_table"].lineNumber?"\n"+outputLogTable():"")
		);
	}
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
				fileName=process.argv[1].replace("compile.js", "testCode.0xmin");
			}
			let inputFile=await oxminCompiler.fileLoader(fileName);
			return [inputFile,fileName];
		})();
		let outputFile=null;
		let fileWriter=()=>new Promise((resolve,reject)=>{//minFilt.lua or a.filt
			let newFileName=process.argv[3];
			if(!newFileName&&!buildSettings.makeFile){resolve("no file");return;}
			//else{console.log("made file")}
			newFileName??="minFilt.lua";//?? "a.filt" ?? "minFilt.lua";
			let fileType=newFileName.match(/(?<=\.)[^.]*$/)?.[0]??"filt";
			let content=outputFile;
			if(typeof content!="string"){//content:Uint32Array
				if(fileType=="lua"){
					let varName=newFileName.replaceAll(".", "_");
					content="minFilt={"+outputFile+"}";
				}
			}
			fs.writeFile(newFileName, content, err => {
				if (err)reject(err);
				else resolve();
				//file written successfully
			})
		});
		(async function(){
			let [inputFile,fileName]=await fileLoader;
			outputFile=await oxminCompiler(inputFile,fileName,);
			await fileWriter();
			return outputFile;
		})();
	}
}
//13959