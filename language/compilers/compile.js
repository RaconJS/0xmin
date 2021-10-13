//node.js version 16
//BODGED
//UNFINISHED
const errorMsg="\x1b[31m"+" 0xmin-ERROR ::"+"\x1b[0m ";
function errorLog(...args){console.log(...args);};
function loga(...args){console.log(...args);};
const recompileBin=function(line){
	if(isNaN(line))return NaN;
	if(line==30)return "null;";
	let strs=[];
	let commands=["move", "jump", "nor", "red", "blue", "get", "set", "if"];
	let command=commands[line&((1<<4)-1)];
	if(command&& !(line&~((1<<4+8+1)-1))){//only a 0xmin command
		strs.push(command);
		let reljump=(line>>4)&((1<<8)-1);
		let reljumpStr;
		let sign=(line>>4+8+1-1)&1;//1 => is negative
		if(command=="jump"&&sign&&reljump&1){//first bit is always positive
			reljump-=2;
		}
		if(reljump!=0||sign){//|| ["jump", "move"].includes(command)){
			reljumpStr=["+", "-"][sign]+("0x"+(reljump).toString(16));
			strs.push(reljumpStr);
		}
		return strs.join(" ")+";";

	}else{return "0x"+line.toString(16)+";";}
}
const buildSettings={
	makeFile:false,
	drawTable:false,
	logFinalCode:true,
};
const oxminCompiler=async function(inputFile,fileName){
	let getPartsFromFile,parsed,strictMode,fileList;
	{//do strings,comments and file settings.
		parsed={
			inputFile:inputFile,
			outputBinary:[],
			outputFile:[],
			scopes:{main:{}},
			labels:[],
		};
		let Path=require("path");
		strictMode=false;
		fileList={
			[fileName]:inputFile,
		};
		let parts=inputFile;
		let texts={
			"make file"(val=true){
				buildSettings.makeFile=val;
				//console.log("make file")
			},
			"log.table"(val=true){
				buildSettings.drawTable=val;
				//console.log("log.table")
			},
			"log.code"(val=true){
				buildSettings.logFinalCode=val;
				//console.log("log.code")
			}
		};
		let getRegex=i=>new RegExp('^\\s*"'+i+'";\\s*');//'^\\s*("'+i+'";|\\/\\/'+i+';|\\/\\*'+i+';\\*\\/)\\s*');
		for(let i=0,found=true;i<10&&found;i++){
			found=false;
			for(let i in texts){//to make a file.filt the file.0xmin should start with "make file";
				let regexp,match;/^\s*("make file";|\/\/make file;|\/\*make file;\*\/)\s*/;
				match=parts.match(regexp=getRegex(i));
				if(match){
					parts=parts.replace(regexp,""+[...match[0].matchAll("\n")].join(""));
					found=true;
					texts[i](true);
					break;
				}
				match=parts.match(regexp=getRegex("!"+i));
				if(match){
					parts=parts.replace(regexp,""+[...match[0].matchAll("\n")].join(""));
					found=true;
					texts[i](false);
					break;
				}
			}
		}
		let TST=0;
		getPartsFromFile=(inputFile)=>{
			let parts=inputFile;
			let strings=[];//split strings
			//split(/(?=["'`])/);
			parts=(" "+parts).split(/(?=["'`])/);parts[0]=parts[0].substr(1);
			for(let i=0;i<parts.length;i++){
				if(i>0&&i<parts.length-1){
					if(parts[i][0]==parts[i+1][0]&&parts[i][parts[i].length-1]!="\\"){//["abc,"123] => ["abc",123]
						parts[i]+=parts[i+1][0];
						parts[i+1]=parts[i+1].substring(1);i++;
					}else{
						parts[i]=parts[i]+parts[i+1];
						parts.splice(i+1,1);
						i--;continue;
					}
				}
				for(let j=0;j<parts.length*2;j++){//handle strings in comments
					let match;
					let endComment=
						parts[i].match(/\/\/(?![^\n]*?\n)/)?/(?<=\n)/
						:parts[i].match(/\/\*(?![\s\S]*?\*\/)/)?/(?<=\*\/)/
					:undefined;
					//if ("/*comment) or ("// comment)
					if(endComment){//if unended comments
						for(let end=false;i+1<parts.length&&!end;){
							parts[i]=parts[i]+parts[i+1];
							if(match=parts[i+1].match(endComment))end=true;
							parts.splice(i+1,1);
						}
						if(match){
							let part=parts[i].substring(match.index);
						}else{break;}
					}
				}
			}//parts[0]!=string
			let commentRexExp= /(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*)/;
			let commentRexExpG=/(\/\*[\s\S]*?\*\/)|(\/\/[^\n]*)/g;
			let newlinesString=len=>new Array(len).fill("\n").join("");
			for(let i=0;i<parts.length;i+=2){//remove comments
				for(let j of parts[i].matchAll(commentRexExpG)){
					let newLineLength=[...parts[i].match(commentRexExp)[0].matchAll("\n")].length;
					parts[i]=parts[i].replace(commentRexExp,newlinesString(newLineLength));
				}
				//parts[i]=parts[i].replaceAll(/(\/\*(.|\n)+\*\/)|(\/\/.*)/g,"");
			}
			strings.Str=Str;
			parts.reduce((s,v,i,a)=>{
				if(i%2==1){
					strings.push(new Str({str:v,start:s,length:v.length}));
				}
				return s+v.length;
			},0);//index0,length
			let p1=[];
			for(let i=0;i<parts.length;i++){
				if(i%2==0){
					p1.push(...parts[i].split(/(?<=[{};])/));
				}
				else {
					let n=i>>1;//same as (i/2)|0
					
					p1.push(strings[n]);
					//""+[...(""+strings[n]).matchAll("\n")].map(v=>"\n").join("");//IGNORE STRINGS
				}
			}
			parts=p1;
			return parts;
		}
	}
	//generate scopes
		let bracketRegex=/{([^{}]|)*}/;
		//classes
			class OxminState{
				jump=0;
				move=0;
				alu=[30];//for testing "#set alu=[1,3];"
				//if=false;//aluif
				//alu=30;//registor
				//then=false;//is skipping
				constructor(obj={}){
					Object.assign(this,obj);
				};
				static state=new this();
			};
			Str=class{
				constructor({str,start,length}={}){
					this.str=str;
					this.start=start;
					this.length=length;
				}toString(){return this.str;}
			}
			let throwErrorLine=(fileLineNumber)=>typeof fileLineNumber=="number"//number or codeObj
				?"line "+fileLineNumber+": '"+inputFile.replaceAll("\t", "").split("\n")[fileLineNumber-1]+"'"
				:"line "+fileLineNumber.sourceLineNumber+": '"+fileLineNumber.croppedSource+"'";
			let throwErrorFile=fileName=>typeof fileName=="string"//string or codeObj
				?(fileName==mainFileName?"":"file:"+callStack[callStack.length-1].fileName+", ")
				:(fileName.fileName==mainFileName?"":"file:"+fileName.fileName+", ");
			let lister=obj=>{let a=[];for(let i in obj){a.push(i)}return a;};
			class Scope{// extends String{
				constructor(dataObj={},isPartOfScope=false){
					//super(dataObj.toStringString);
					this.scopes.var=this;
					this.scopes.let=this;
					this.isVarBlock=false;
					this.codeBlock=new String("{UNDEFINED CODE BLOCK}");
					this.codeBlock.code=[];
					if(!isPartOfScope&&0){//sytem not finnished
						let parent=this;
						dataObj.labels??={};
						dataObj.labels.def??=new Scope({isDefaultLabel:true,name:"def ->",
							get codeObj(){return parent.codeObj},
							set codeObj(val){parent.codeObj=val;},
						},true);
						dataObj.labels.block??=new Scope({isDefaultLabel:true,name:"block (){}",
							get code(){return parent.code},
							set code(val){parent.code=val;},
						},true);
						dataObj.labels.var??=new Scope({isDefaultLabel:true,name:"var {}",
							get labels(){return parent.labels},
							set labels(val){parent.labels=val;},
						},true);
					}
					Object.assign(this,dataObj);
				}
				intoLetBlock(codeObj){//"label:{"
					this.labels[this.name]=this.labels["self"]??=this;new Label({
						name:this.name,
						isDefaultLabel:true,
						parent:this,
						labels:this.labels,
						scopes:{
							parent:this,
							//var:newScope.getVar(),
							//let:newScope.getLet()
						},
						isDefaultLabel:true,
						codeObj:this,
					});
					let newLbl=new EndBlock({
						name:"break",
						isDefaultLabel:true,
						scopes:{
							parent:this,
							//var:newScope.getVar(),
							//let:newScope.getLet()
						},
						labels:{//inherrint other breaks
							//"move->break.lbl1;move->break.lbl2;" 
							...(findLabel(this,"break")??{}),
							[this.name]:this.labels[this.name],
						},
						parent:this,
						isDefaultLabel:true,
					});
					this.labels[newLbl.name]=newLbl;
					return this;
				}
				intoVarBlock(codeObj){//"label{"
					this.labels.jump=new Pointer({address:0,name:"jump"});
					this.labels.move=new Pointer({address:0,name:"move"});
					this.labels.alu=new Pointer({address:0,name:"alu",label:undefined});
					{
						this.labels["this"]??=this;new Label({
							name:"this",
							isDefaultLabel:true,
							parent:this,
							labels:this.labels,
							scopes:{
								parent:this,
								//var:newScope.getVar(),
								//let:newScope.getLet()
							},
							isDefaultLabel:true,
							codeObj:this,
						});
						let newLbl=new EndBlock({
							name:"return",
							isDefaultLabel:true,
							scopes:{
								parent:this,
								//var:newScope.getVar(),
								//let:newScope.getLet()
							},
							parent:this,
							isDefaultLabel:true,
						});
						this.labels[newLbl.name]=newLbl;
						//this.labels[newLbl.name].codeObj=undefined;
					}
					if(!this.isVarBlock){//default: isVarBlock==false
						//this.lineNumber=0;
						this.isVarBlock=true;
					}

					return this;
				}
				getLet(){
					return this.scopes.let??this.scopes.parent?.getLet?.()??this.parent?.getLet?.();
				}
				getVar(){
					return this.scopes.var??this.scopes.parent?.getVar?.()??this.parent?.getVar?.();
				}
				getLine(){
					if(!this.islogged_getLine)this.islogged_getLine=1;
					else{
						console.error(this.name,this.islogged_getLine++);
						//An rror caused by this repeating more than once even though this should be imposible.
						//I do not know if this error is possible.
						//if it is possible then uncomment the following line:
						//else return 0;
						//This is a bodgeing line and doesn't actually solve the real problem of
						//why there is self recurrsion in the first place.
						throw Error(errorMsg+"unknown compiler bug found. recursion. look at code for more info");
					}
					let parent=this.getVar();
					let line=(this.address??this.lineNumber)+(parent&&parent!=this?parent.getLine():0);
					this.islogged_getLine=0;
					return line;
				}
				findLabel(name){
					return findLabel(this,name);
				}
				findLabelParent(name){
					return findLabelParent(this,name);
				}
				parent=null;
				labels={};
				parameters=[];
				scopes={
					var:null,
					let:null,
					parent:null,
				};
				toStringString="";
				//toString(){return this.toStringString;}
				code=[];
				//codeStr="";
				relAddress=0;//relative to lineNumber
				static searchAddressSymbol=Symbol("isUsed");
				set address(v){this.relAddress=v-this.address;}
				get address(){//only used in the non-meta pass
					let codeObj=Scope.currentCodeObj;
					if(this[Scope.searchAddressSymbol]){
						errorLog("Error: pottencial recursion");
						throw new Error(errorMsg//error 
							+throwErrorLine(codeObj)//+"line "+this.sourceLineNumber+": '"+inputFile.replaceAll("\t", "").split("\n")[this.sourceLineNumber-1]+"'"
							+" , label:'"+this.name+"' references its self in deffinition. Can be caused by '#set A=>B;#set B=>A;'. Try adding: '1234 def "+this.name+";'"
							+throwErrorFile(codeObj)
						);
					}
					this[Scope.searchAddressSymbol]=true;
					if(!this.codeObj){
						//errorLog(this);
						errorLog("Error: this.codeObj is undefined");
						throw new Error(errorMsg//error 
							+throwErrorLine(codeObj)
							+" , label:'"+this.name+"' is probably not defined. Try adding: '1234 def "+this.name+";' "
							+throwErrorFile(codeObj)
						);
					}
					delete this[Scope.searchAddressSymbol];
					return ((this.codeObj instanceof Scope?this.codeObj.address:this.codeObj.lineNumber)??this.codeObj.address)+this.relAddress??0;
				}
				getDataSummery(){
					let labels=[];for(let i in this.labels)labels.push(i);
					let code=getCode(this).map(v=>v.croppedSource);
					let type=(this.isFunction?"function":this.isBlock?"block":this.wasDeclared!==false?"label":"undefined");
					let address;try{address=this.codeObj?.address;}catch(error){address=undefined;}
					let data={
						name:this.name,
						type:type,
						def:(!!address)||(!!this.codeObj),
						relAddress:+this.relAddress,
						parent:this.parent?.name,
						scope:(this.scopes.parent??this.getLet()??this.getVar())?.name,
						vars:labels,
						parameters:this.parameters,
						code:code,
					};
					//if(!data.parent||this.scopes.parent==globalScope){delete data.parent;}
					if(!this.parameters){delete data.parameters;}
					if(!this.isBlock){delete data.code;}
					if(data.vars.length==0){delete data.vars;}
					return data;
				}
			};
			class EndBlock extends Scope{//for labels "block.return" and "block.break"
				constructor(dataObj){
					super(dataObj);
				}
				isDefaultLabel=true;
				hasDefaultCodObj=true;
				codeObjVal=undefined;
				relAddress=0;
				get codeObj(){
					//if(this.isDefaultLabel)return this.parent.code[this.parent.code.length-1]??this.parent;
					//else return this.codeObjVal;
					return this.codeObjVal;
				}
				set codeObj(val){
					if(this.hasDefaultCodObj){
						this.hasDefaultCodObj=false;
						//this.relAddress=0;
					}
					this.codeObjVal=val;
				}
			}
			class CodeObj extends String{
				parent=null;
				constructor(string,dataObj={}){
					super(dataObj.toStringString);
					Object.assign(this,dataObj);
				}
			}
			class Label extends Scope{
				constructor(...args){
					super(...args);
					//for(let i of ["lineNumber", "nonMetaCode", "labels", "code"]){
					//	Object.defineProperty(this,i,{...Object.getOwnPropertyDescriptor(this,i),enumerable:false});
					//}
				}
				//address;
				value;
			};
			class Pointer extends Scope{
				name;
				get address(){return OxminState.state[this.name];};
				set address(v){OxminState.state[this.name]=Math.max(0,v);}
				constructor(obj={}){
					super({});
					this.labels=[];
					Object.assign(this,obj);
				}
				static getDataSummery=Scope.prototype.getDataSummery;
				getDataSummery(){
					let data=this.constructor.getDataSummery.call(this);
					return {...data,name:this.name,type:"pointer",address:this.address}
				}
			};
			class CallStackObj{
				constructor(obj={sourceLineNumber,scope,fileName,parent}){
					Object.assign(this,obj);
				}
				inFile(fileName){
					return this.fileName==fileName||this.parent?.inFile(fileName);
				}
				toString(){
					return this.sourceLineNumber+":"+this.scope.name+":"+this.fileName;
				}
			};
			let findLabel=function(scope,name){
				//TST++
				//if(TST>=5000){throw new Error("::"+scope?.name+"::"+name);}
				if((!scope)||(scope[findLabel.key]??0)>0)return;
				scope[findLabel.key]??=0;
				scope[findLabel.key]++;
				let label=
					scope.labels[name]??
					findLabel(scope.scopes.parent,name)??
					findLabel(scope.scopes.let,name)??
					findLabel(scope.scopes.var,name)??
					findLabel(scope.parent,name)
				;
				delete scope[findLabel.key];
				return label;
			};findLabel.key=Symbol("");
			let findLabelParent=function(scope,name){
				//TST++
				//if(TST>=5000){throw new Error("::"+scope?.name+"::"+name);}
				if((!scope)||(scope[findLabel.key]??0)>0)return;
				scope[findLabel.key]??=0;
				scope[findLabel.key]++;
				let label=scope.labels[name]?scope:(
					findLabelParent(scope.scopes.parent,name)
					??findLabelParent(scope.scopes.let,name)
					??findLabelParent(scope.scopes.var,name)
					??findLabelParent(scope.parent,name)
				);
				delete scope[findLabel.key];
				return label;
			};

			let getCode=function(scope){
				let code=[...(function*getCode(scope){//supports working with different files
					if(!scope.code);
					for(let i of scope.code){
						yield i;//i+"";
						if(i.code)yield*getCode(i);
						//if(i.label?.code)yield*getCode(i.label);
					}
				})(scope)];
				code.poped=code.pop();//removes /^{/ and /}$/
				return code;
			};
			let strToNumber=function(str){
				return +(""+str).replace(/^[+-]/,"")*[1,-1][+((""+str)[0]=="-")];
			};
		//----
		//inbuilts
			let debuggingTool={
				async parse({words,codeObj,scope,parts}){//("{debugger}"")={labelof,};
					let i=words.i;words.i=0;
					let cmd;
					({label:cmd}=await parseFunction.parseLabelOrNumber({words,scope,codeObj,makeVars:false}));
					if(cmd?.isDebugger){
						let error="\x1b[33m"+(codeObj.isMeta?"#":"")+cmd.name+"::"+"\x1b[0m";
						let label;
						if(words[words.i]){
							({label,wasDeclared}=await parseFunction.parseLabelOrNumber({error,words,scope,codeObj,makeVars:false}));
							if(!wasDeclared)label=new Scope({name:(label?.name??words[i][0])+"?",wasDeclared:false});
						}
						else{
							label=scope;
						}
						await cmd.do?.({words,codeObj,scope,label,error,parts});	
					}else{
						words.i=i;
					}//words.i=i;
				},
				debuggerObj:new Label({
					isDebugger:true,
					name:"{DEBUGGER}",
					labels:{},
					isDebugger:true,
					async do({words,scope,codeObj,label,error}){
						if(label instanceof Scope||label instanceof Pointer){
							let data=label.getDataSummery();
							//delete data.name;
							console.warn(error,data);
						}else{
							throw Error(error+":ERROR: "+"label: '"+words[words.i]+"' was not declared"+throwErrorFile(codeObj.fileName));
						}
						codeObj.isNonMeta=false;
					}
				}),
				init(){
					let label;
					label=new Label({
						name:"{labelsOf}",
						isDebugger:true,
						async do({words,scope,codeObj,label,error}){
							if(label instanceof Scope){
								let list=[];for(let i in label.labels)list.push(i);
								console.warn(error+"'"+label.name+"':",list);
							}else{
								throw Error(error+":ERROR: "+"label:"+words[words.i]+"was not declared"+throwErrorFile(codeObj.fileName));
							}
							codeObj.isNonMeta=false;
						}
					});
					this.debuggerObj.labels["labelsOf"]=label;
					this.debuggerObj.labels["labelsof"]=label;

					label=new Label({
						name:"{typeOf}",
						isDebugger:true,
						async do({words,scope,codeObj,label,error}){
							//errorMsg+"line"+codeObj.sourceLineNumber+
							if(1||label instanceof Scope){
								//let list=[];for(let i in label.labels)list.push(i);
								console.warn(error+"'"+label.name+"':",
									(label.isFunction?"function":label.isBlock?"block":label.wasDeclared!==false?"label":"undefined"),
									"| defined:",!!label.codeObj
								);
							}else{
								throw Error(error+"label:"+words[words.i]+"was not declared");
							}
							codeObj.isNonMeta=false;
						}
					});
					this.debuggerObj.labels["typeOf"]=label;
					this.debuggerObj.labels["typeof"]=label;

					label=new Label({
						name:"{codeOf}",
						isDebugger:true,
						async do({words,scope,codeObj,label,error}){
							if(label instanceof Scope){
								let list=getCode(label).map(v=>v.croppedSource);
								console.warn(error+"'"+label.name+"':",list);
							}else{
								throw Error(error+":ERROR: "+"label:"+words[words.i]+"was not declared"+throwErrorFile(codeObj.fileName));
							}
							codeObj.isNonMeta=false;
						}
					});
					this.debuggerObj.labels["codeOf"]=label;
					this.debuggerObj.labels["codeof"]=label;
					
					const vm = require('vm');
					label=new Label({
						name:"{log}",
						isDebugger:true,
						async do({words,scope,codeObj,label,error,parts}){//runs custom code'debugger.log"2+4,scope``"' --> "{log}:6 Scope{...}"
							let str=parts[parts.i+1]+"";
							if(0&&!str){//!(str instanceof Str)){
								throw Error(error+"line:"+(codeObj.sourceLineNumber+1)+"isnt a string. try adding \"scope.labels\"");
							}
							const sandbox = {log:"no log;",lister,words,scope,label,codeObj,parts,Scope,Label};
							vm.createContext(sandbox);
							const code = "log = ["+(""+str).match(/(?<=^.)[\s\S]*(?=.$)/)?.[0]+"\n]";//removes start and end ' " 's
							vm.runInContext(code, sandbox);
							console.warn(error,...sandbox.log)
							codeObj.isNonMeta=false;
						}
					});
					this.debuggerObj.labels["log"]=label;
					return this;
				},
			}.init();
			let parts=getPartsFromFile(inputFile);
			let scope=new Scope({name:["{GLOBALSCOPE}"]}).intoVarBlock();{
				scope.isBlock=true;
				scope.codeObj=new String("{GLOBAL_SCOPE's CUSTOM CODEOBJ}");
				scope.codeObj.lineNumber=0;
				scope.labels["0xmin"]=new Label({
					name:"0xmin",
					codeObj:scope,
				});
				scope.labels["debugger"]=debuggingTool.debuggerObj;
				scope.labels["Object"]=debuggingTool.debuggerObj;
				debuggingTool.debuggerObj.scopes.parent=scope;
			}
		
		//lets
			let globalScope=scope;
			let index=0;
			let lineNumbers=[];
			let parseReps=0;
			let mainFileName=fileName;
			let callStack=[];
			let functionLevel=0;
		let parseFunction=async function({scope,parts,codeScope,fileName,callStack=[],functionLine=1}){
			//codeScope??=new Scope({})
			//dont run ("foo(){...code;}") function on block creation.
			//only run ("foo();") functions when called
			let throwErrorFile=fileName=>fileName==mainFileName?"":"file:"+fileName+", ";
			let sourceLineNumber=functionLine;
			callStack.push(new CallStackObj({
				scope,
				sourceLineNumber,
				fileName,
				parent:callStack[callStack.length-1]??undefined
			}));
			//functions
				function line_evalVariable({scope,lineStr,isMeta,isBlock,isFunction,isVarScope,index,codeObj}){
					//index=next index
					let match;
					let isLabeledBlock,hasDef,command,equalsSign;
					if(match=lineStr.match(/(?<=\w+\s*)(=>|<=|=|->|<-)(?=\s*(\([\w\W]*\))?\s*{)/)){//"label=>{"
						equalsSign=match[0];//"=>" or "<=" ("a = b.ref" or "a = b.val")
						command="set";
					}
					if(lineStr.match(/\([\w\W]*\)\s*{/))isFunction=true;// "(){"
					if(match=lineStr.match(/(?<!#\s*):?\s*(\([\w\W]*\)\s*)?{/)) {//a:{} or {}
						isBlock=true;
						if(match[0].match(":")){//"name:{"
							isLabeledBlock=true;
							hasDef=true
						}
					}//"{" note:"#{" doesn't have block scope
					else isBlock=false;
					let newScope=new Scope({parent:scope});
					//newScope.scopes.var=isFunction?undefined:scope.scopes.var;
					//newScope.scopes.let=isBlock?undefined:scope.scopes.let;
					let lbl,lblName,lblBlock;
					let lastBacketIndex,last1, brackets=0;
					for(let i of lineStr.matchAll(/\(|\)/g)){
						if(i[0]=="("){
							if(brackets==0){
								last1=i.index;
							}
							brackets++;
						}
						else brackets--;
						if(brackets==0){
							lastBacketIndex=i.index;
						}
					}
					let words=[...lineStr.substr(0,last1).matchAll(/\w+|\.\.\.|\.|\[/g)];
					let lastWasName=false;
					let i=0;
					for(i=0;i<words.length;i++){
						let thisIsName=false;
						let word=words[i][0];
						if(!lbl&&word.match(/\b(let|def|var|set)\b/)){
							if(word=="def"){
								hasDef=true;
							}
							else if(!command){
								command=word;
							}
							isVarScope=true;
						}
						else if(word.match(/\w+/)){
							if(lastWasName){
								break;
							}
							lastWasName=true;
							if(!lblBlock){
								if(command=="let"){
									lblBlock=scope.getLet();
								}else if(command=="var"){
									lblBlock=scope.getVar();
								}else{
									lblBlock=scope;
								}
							}
							else{
								lblBlock=lbl;
							}
							lbl=lbl?lblBlock.labels[word]:findLabel(lblBlock,word);
							if(!lbl){
								lbl??=new Scope({name:word});
								lbl.scopes.parent=lblBlock;
								lbl.parent=scope;
								//lbl.lineNumber=lbl.getVar().lineNumber;
								lbl.sourceLineNumber=sourceLineNumber;
							}
							if(i<words.length&&!isLabeledBlock)lblBlock.labels[word]=lbl;
						}else if(word=="."){
							if(!lbl)throw new Error(errorMsg+'label:"'+words[i-1][0]+'" is undefined'+'"'+lineStr+'"');
						}
						lastWasName=thisIsName;
					}
					if(words.length>0)index=words[i-1].index+words[i-1].length;
					else index=0;
					//scope.code.pop();scope.code.push(newScope);
					if(lbl&&!isLabeledBlock){//"a{};" | "var a{};"
						if(!(command=="var"||command=="let"))newScope=lbl;//use existing label e.g. "def a{};" or "a{};"
						if(command=="set"){
							//default assignment is: "add block code onto the existing label code"
							switch(equalsSign){
								case"=":
								lbl=newScope;
								break;
								case"=>"://"label=>{". set new block
								newScope.code=[];
								newScope.parameters=[];
								newScope.isFunction=isFunction;
								newScope.isBlock=isBlock;
								break;
								case"<="://"label<={" resets code. sets block value
								for(let i=0,len=newScope.code.length;i<len;i++){
									newScope.code.pop();
								}break;
								case"->":
								lbl.codeObj=newScope;
								break;
								case"<-":
								if(hasDef)lbl.codeObj=newScope.codeObj=codeObj;
								break;
								default:
								if(equalsSign!=undefined)throw Error(errorMsg+throwErrorLine(codeObj)+"symbol:'"+equalsSign+"' isn't a supported type of assignment"+throwErrorFile(codeObj));
							}
						}
						//lbl.toStringString=lineStr;
						//codeObj.label=newScope;//codeObj=lbl;
						//if(["var","let"].includes(command))
						lblBlock.labels[lbl.name]=newScope;
						newScope.scopes.parent=lblBlock;
						newScope.name=lbl.name;
					}
					else{ //if(!isFunction){//unlabled normal scope "{" or "lbl:{"
						newScope.scopes.parent=lblBlock;
						codeObj.label=newScope;
						//throw new Error(errorMsg+"could not find label:"+'"'+lineStr+'"');
						if(isLabeledBlock){//"lbl:{"
							newScope.name=lbl.name;
							newScope.intoLetBlock(codeObj);
						}
					}
					if(isVarScope&&!newScope.isVarScope){//isFunction||command=="let"||command=="var"){
						newScope.scopes.var=newScope;
						newScope.intoVarBlock(codeObj);
					}else if(newScope!=lbl){//labeled block scope
						let newLbl;
						newScope.scopes.var=newScope.parent.getVar();
						//newScope.scopes.let=newScope;
					}
					if(newScope.isBlock){//remove existing end line
						//if(newScope.labels["return"]?.isDefaultLabel)newScope.labels["return"].codeObj=undefined;
						//if(newScope.labels["break"]?.isDefaultLabel)newScope.labels["break"].codeObj=undefined;
						if((newScope.code[newScope.code.length-1]+"").match(/\s*}/)){
							newScope.code.pop().isDeleted=true;
						}
					}
					newScope.sourceLineNumber??=sourceLineNumber;
					Object.assign(newScope,{isMeta,isFunction,isBlock,isVarScope})
					if(hasDef){//"def var block{...code};""
						newScope.codeObj=codeObj;
						codeObj.label=newScope;
					}
					if(isFunction){//BODGED: not sure about what happens when concatnaiting functions
						let words=lineStr.match(/(?<=\().+$/)[0].split(/,|\)|\(/);
						newScope.parameters=[];//list of parameter names
						let brackets=1;
						for(let i=0;i<words.length&&brackets>0;i++){
							word=words[i];
							if(word=="(")brackets++;
							else if(word==")")brackets--;
							else {
								let match=word.match(/[\w]+/);
								if(match){
									newScope.parameters.push(match[0]);
									newScope.labels[match[0]]=new Label({
										name:match[0],
										scopes:{parent:newScope},
										parent:scope,
										codeObj:codeObj,
										sourceLineNumber:sourceLineNumber
									})
								}
							}
							index+=word.length;
						}
					}
					{
						//Object.defineProperties(codeObj)
						//

						newScope.codeBlock=codeObj;//code can be read by getCode(scope/codeObj) for calls:"foo();"
						codeObj.code=[];//newScope.code;
						if(isBlock)newScope.scopes.let=newScope;
						else newScope.scopes.let=undefined;
						newScope.parent=scope;
						scope=newScope;
						newScope.sourceLineNumber=sourceLineNumber;
					}
					return {scope,lineStr,lbl,codeObj};
					//===========================================================================================
				};
				const setEndBlock=(scope,codeObj)=>{
					for(let i=0;i<2;i++){
						let name = ["break", "return"][i];
						let self = ["self", "this"][i];
						if(scope.labels[name]?.isDefaultLabel&&scope.labels[name].hasDefaultCodObj){
							if(codeObj)scope.labels[name].codeObj=codeObj;
							else {
								scope.labels[name].codeObj=scope.labels[self];
								//scope.code[scope.code.length-1];
							}
							scope.labels[name].relAddress=0;//1;
							scope.labels[name].hasDefaultCodObj=true;
						}else if(name=="return"){
						}
					}
				};
				const setReturns=(scope)=>{
					let code=scope.code[scope.code.length-1];
					if(scope.scopes.let)setEndBlock(scope.scopes.let,code);
					if(scope.scopes.var)setEndBlock(scope.scopes.var,code);
					setEndBlock(scope,code);
				}
				if(parts.length==0&&scope.code.length==0){
					setReturns(scope);
				};
				let i=0,bail=10000,skipParts=0;
				let onContinue=()=>{};

				let varType="meta";//for "#var a{},b{},d{}"
				//varType is UNFINISHED (REMOVE this old/ unused system)
			//----
			for(;i<parts.length&&i<bail;[i++,parseReps++]){
				if(parts[i] instanceof Scope&&parts[i].isInstance){//for functions "foo();" DELETE
					//obsillete
					throw Error("compiler bug found. This if statement should be not used, or be true. Check 'eval parameters' and 'foo()' parsing");
					continue;
				}
				let oldSourceLineNumber=sourceLineNumber;
				let lineStr=parts[i]+"";//.replaceAll(/^\s+/g,"").replaceAll(/\s+/g," ");
				mainForLoop:{
					let partI=parts.i=i;
					let isMeta=Boolean(lineStr.match(/^[\s]*#/))//||scope.isMeta;
					sourceLineNumber=parts[i].sourceLineNumber??oldSourceLineNumber+[...lineStr.match(/^[\s]*/)[0].matchAll("\n")].length;
					scope.code??=[];
					let codeObj=new String(parts[i]);
					if(parts[i] instanceof Str)codeObj=new Str(parts[i]);
					{
						codeObj.parent=scope;
						codeObj.label=undefined;
						codeObj.croppedSource=(""+codeObj).replace(/^[\s]*/g,"").replaceAll(/\s/g," ");
						codeObj.partIndex=i;
						codeObj.isMeta=isMeta;
						codeObj.sourceLineNumber??=parts[i].sourceLineNumber??sourceLineNumber;
						codeObj.fileName=parts[i].fileName??fileName;
						//codeObj.lineNumber="";
					}
					if(codeScope){
						codeScope.code.push(codeObj);
						if(typeof parts[partI]=="string")codeScope.codeBlock.code.push(codeObj);
					}
					if(parts[i] instanceof Str){break mainForLoop;}//ignore strings : ' "abc"; '
					if(skipParts>0){skipParts--;break mainForLoop;}
					if(partI==parts.length-1){//last "...;" part
						setReturns(scope);
					}
					if(lineStr[lineStr.length-1]=="}"){
						if(functionLevel==0){
							setReturns(scope);
						}
						if(0)if(parts[i+1])if(parts[i+1]==";"){
							parts[i]+=parts[i+1];
							parts.splice(i+1,1);//splicing isn't allowed so that functions can work.
							lineStr=parts[i];
						}
						if(scope.isFunction){functionLevel--;}
						scope=scope.parent;
						if(!scope){
							throw new Error(errorMsg+throwErrorLine(codeObj)+" unballanced brackets. Try removeing '}' "+throwErrorFile(codeObj));
						}
						codeScope&&=scope;
					}else if(lineStr[lineStr.length-1]=="{"){
						let isBlock=true;
						let ret=line_evalVariable({scope,lineStr,isMeta,isBlock,codeObj});
						scope=ret.scope;
						if(codeScope)codeScope=scope;//codeScope&&=scope;
						lineStr=ret.lineStr;
						let lbl=ret.lbl;
						if(scope.isFunction)functionLevel++;//ignore code in "foo(){...code;}" untill called "foo();"
						//codeObj=ret.codeObj;
					}else if(functionLevel==0&&(1||lineStr[lineStr.length-1]==";"))ifBlock:{
						varType="meta";
						let wordsRegex=/(\.\.\.)|[_\w.\[]+|,|\[|(->|<-|<=|=>|=)|[+-]?(0[xb])?[0-9a-fA-F]+|(\+\+?|--?|\*\*?|\/)|(&&?|\|\|?|!|\^\^?|~)/g;
						let words=[...lineStr.matchAll(wordsRegex)];//betterone: /([_\w,\[]+\s*\.\s*)*[_\w,\[]+|\[|(->|<-)|[+-]?(0[xb])?[0-9a-fA-F]/g)];//
						let argsObj={words,scope,lineStr};
						words.i=0;
						let index=0;
						//functions
							const evalParamaters=parseFunction.evalParamaters=async function({index,lineStr0,scope,label,codeObj,makeVars=true,wasDeclared}){
								let lineStr=lineStr0.substring(index);
								let functionType=lineStr.match(/^\s*(=>)?\s*\(/);//"foo=>();" or "foo();"
								let index1=0;
								if(functionType&&!wasDeclared)throw Error(
									errorMsg+throwErrorLine(codeObj)+" function: '"+label.name+"' was not declared. "+throwErrorFile(codeObj)
								);
								if(functionType){//&&label.isFunction){//label?.parameters
									let foo=label;
									let words=[...lineStr.matchAll(/,|;|\(|\)|[^()]+/g)].map(v=>v); //|(?<=\()|(?=\)|;)/);
									let brackets=0,openedBrackets=false;
									let word;
									let index=0;
									let parameters=[];
									for(words.i=0;words.i<words.length&&(brackets>0||!openedBrackets);words.i++){
										if(words[words.i].index<index)continue;
										word=words[words.i][0];
										if(word[0]=="("){brackets++;openedBrackets=true;}
										else if(word[0]==")")brackets--;
										else if(word.match(/^(;|,)/)){}
										else {
											let label;
											//index=word.index;
											({label,index}=await evalLabel({index,lineStr,scope,codeObj,words,makeVars:false}));
											if(label)parameters.push(label);
											else throw Error(errorMsg+throwErrorLine(codeObj)+"label '"+word+"' was not declared"+throwErrorFile(codeObj));
											continue;
										}
										index+=word.length;
									}
									label=new Scope({
										//...foo,
										name:"<"+foo.name+">",//instance name
										//parent:globalScope,
										parentFunction:foo,
										parent:scope,
										code:[],//foo.code,
										isBlock:true,
										isMeta:codeObj?.isMeta,
										labels:{constructor:foo},
									}).intoVarBlock();
									label.scopes.parent=foo.scopes.parent;//closure: use foo's parent's variables
									if(functionType[0].match("=>"))label["this"]=findLabel(scope,"this");//"#set lbl = foo=>();" lbl.this=foo;
									else{label["this"]=findLabel(foo.parent,"this");}
									for(let i=0;i<parameters.length;i++){
										//if parameter doesn't exist it uses label in foo's parent scope
										if(parameters[i])label.labels[foo.parameters[i]]=parameters[i];
									}
									label.isInstance=true;
									let code=getCode(foo);
									code.push(code.poped);//dont loose end brackets or code
									if(code[0]?.sourceLineNumber==undefined){
										//console.warn("WARNING foo.sourceLineNumber may be incorrect. Check line ~873 in evalParamaters");
										//WARNING foo.sourceLineNumber may be incorrect
									}
									await parseFunction({scope:label,codeScope:label,parts:code,fileName});//functionLine:callStack,code[0]?.sourceLineNumber??foo.sourceLineNumber,
									index1=index??0;
								};

								index=index+index1;
								label.intoVarBlock(codeObj);
								return {index,lineStr,label};
							};
							const assignError=(name,sourceLineNumber)=>errorMsg+throwErrorLine(codeObj)+" label:'"+name+"' was not declared. Try adding '#let "+name+";' before this line "+throwErrorFile(codeObj);
							const evalLabel=async function({index=0,lineStr,scope,codeObj,makeVars,words=[]}){
								const useStrict=true;
								if(makeVars==undefined)makeVars=-1;
								//returns (existing label) or (a new label with "isDefined = false").
								let lineStr0=lineStr;
								lineStr=lineStr0.substring(index);
								//index=next index
								let label,lblName=undefined,command,hasDef,block;
								let lastWasName=false;
								let wasDeclared=true,isDeclared=true;
								{
									let words=[...lineStr.matchAll(/[,;]|[\w_]\w*|\.\.\.|\.|\(|\[/g)];
									let i=0;
									let thisIsName=false;
									for(i=0;i<words.length;i++){
										let word=words[i][0];
										if(word.match(/\w+/)){
											let tempLabel;
											if(lastWasName){i++;break;}
											thisIsName=true;
											if(!block){
												block=scope;
											}
											else{
												block=label;
											}
											label=tempLabel=label?block.labels[word]:findLabel(block,word);
											if(!label){
												if(makeVars>=0){//normally only creates label when accessing an undefind's properties
													label??=new Label({name:word});
													label.scopes.parent=block;
													label.parent=scope;
													label.sourceLineNumber=sourceLineNumber;
													if(makeVars>=2){//makeVars==2 : "a.b.c" --> (a??new Label).b??new Label).c??new Label
														isDeclared=true;
														(block??label.scopes.parent.getLet()).labels[label.name]=label;
													}
												}else if(makeVars<=-1){//makeVars==-1 : "a.b.c" --> a.b.c.test throw error on undefined
													throw Error(assignError(word,sourceLineNumber));
												}else{//makeVars==0 : "a.b.c" --> a?.b?.c

												}
												isDeclared=wasDeclared=false;
											}
											//if(label){
											//	block.labels[word]=label;
											//}
											lblName=words[i];
										}else if(word=="."){
											if(!isDeclared){
												if(makeVars){
													isDeclared=true;
													(block??label.scopes.parent.getLet()).labels[label.name]=label;
												}
												else if(makeVars==-1){
													throw Error(assignError(label.name,sourceLineNumber));
												}
											}
											if(!label)throw new Error(errorMsg+throwErrorLine(codeObj)+'label:"'+words[i-1]?.[0]+'" is undefined'+'"'+lineStr+'". Try adding "#let '+words[i-1]?.[0]+';" before this line'+throwErrorFile(codeObj));
											thisIsName=false;
										}
										else if(word=="["){}
										else if(word=="("){
											let index;
											let i1=i;
											({index,lineStr,label}=await evalParamaters({index:words[i].index,lineStr0:words[i].input,scope,label,codeObj,makeVars,wasDeclared}));
											for(;i<words.length;i++){//adjust words.i
												if(!words[i+1]||words[i+1]?.index>=index)break;
											}
											//i=Math.max(i1,i);//use the new index next iteration
											word=words[i+1]?.[0];
											thisIsName=false;
										}else if([",", ";"].includes(word)){
											;//+=lblName.index+lblName[0].length;
											break;
										}
										else {
											if(label){i++;break;}
										}
										lastWasName=thisIsName;
									}
									if(words.length>0){
										if(lblName){
											index+=lblName.index+lblName[0].length;
										}
										else{
											index+=0;
										}
									}
								}
								{//call function
									//({index,lineStr,label}=await evalParamaters({index,lineStr0,scope,label,codeObj,makeVars,wasDeclared}));
								}
								return {index,label,block,wasDeclared};
							};
							const cloneForNewLabel=function(label){
								let newLabel=new Label({
									name:label.name,
									parent:label.parent,
									sourceLineNumber:sourceLineNumber,
								});
								newLabel.scopes.parent=label.scopes.parent;
								//newLabel.address=0;//undefined;
								//newLabel.code=[];
								//newLabel.codeObj=undefined;
								return newLabel;
							};
							const parseLabelOrNumber=async({words,pointerOperators=[],lineStr,makeVars=undefined,scope,codeObj})=>{//self contained
								lineStr??=words[0]?.input;
								let val=strToNumber(words[words.i]?.[0]);
								if(!words[words.i]){}
								else if(!isNaN(val)){//jump +4
									let arg=new Number(val);
									arg.word=words[words.i][0];
									arg.type="number";
									words.i++;
									return {label:arg};
								}else if(!pointerOperators.includes(words[words.i]?.[0])){//jump A->B;
									let index,label,wasDeclared;
									({index,label,block,wasDeclared}=await evalLabel({index:words[words.i].index,lineStr:words[words.i].input,scope,makeVars,words,codeObj}));
									for(;words.i<words.length;words.i++){//adjust words.i
										if(!(words[words.i].index<index))break;
									}
									words.i=Math.min(words.i,words.length);
									if(label){
										//for(;words.i<words.length&&words[words.i].index<index;words.i++){}
										//words.i++;
										return {label,index,block,wasDeclared};
									}
									return {index,block,wasDeclared:false};
								}
								return{index:words[words.i]?.index};
							};parseFunction.parseLabelOrNumber??=parseLabelOrNumber;
							const parseSetStatement=async function({label,words,block,codeObj,scope,possiblyNonMeta=false}){ //... 'label => label'
								let oldLabel=label;
								let didParse=false;
								block??=scope;
								let match=words[words.i];//let match=lineStr.substring(index).match(/^(?<=\s*)(=>|<=|=|->|<-)/);//"#var lblA => lblB; can do #set a=>b; as well"
								let oldI=words.i;
								parsingBlock:{if(match)if(["=>", "<=", "=", "->", "<-"].includes(match[0])){//.match(/^(=)$/)){
									words.i++;
									let finalValue;//a label
									evalBrackets_version2:{//TO_DO:{add maths evaluating e.g. "#var a=1+2*4/b;"}
										let arg,num,block;
										finalValue={};
										//index=Math.max(index,words[words.i]?.index??words[words.i-1]?.index+words[words.i-1][0].length);
										finalValue.block=block;
										finalValue.number=undefined;
										let doneLabel=false;
										for(let i=0;i<2;i++){// /set {{label}}={{label}} ({{label}}||{{number}})?; "# a = b +2;""a = +2;"
											let currentBlock;
											({label:arg,block:currentBlock}=await parseLabelOrNumber({words,lineStr,scope,codeObj,makeVars:i==0?false:undefined}));
											if(!doneLabel&&arg instanceof Scope){
												doneLabel=true;
												finalValue.type="label";
												finalValue.value=arg;
												finalValue.block=block;
												block=currentBlock;
											}
											else if(!isNaN(+arg)){
												doneLabel=true;
												finalValue.number=arg;
											}
										}
										/*let oldI=words.i;
										let num;
										({label:num,block}=await parseLabelOrNumber({words,lineStr,scope,codeObj}));
										if(arg instanceof Scope){
											finalValue.type="label";
											finalValue.value=arg;
											finalValue.number=arg;
										}
										else if(!isNaN(+arg)){
											finalValue.type;
											finalValue.number=arg;
										}*/
									}
									//label.scopes.parent.labels[label.name];
									//label.scopes.parent=finalValue.value.scopes.parent;
									//"set labelA=labelB;"
									if(finalValue.number!=undefined||finalValue.value){// if("address" in (finalValue.value??{})){
										didParse=!(finalValue.value instanceof Pointer||label instanceof Pointer);
										if(possiblyNonMeta)break parsingBlock;
										//if(finalValue.value instanceof Pointer||(label instanceof Pointer))
										if(finalValue.value)switch(match[0]){//"#set a -> b ;"
											case"="://strong equals | like "parameter=argument"
												//can get wrong name errors
												loga(block.name);
												(block).labels[label.name]=finalValue.value;//??label.scopes.parent
												label=finalValue.value;
												//"A=B;" -> "scope.labels.A.name=B"
												if(0){
													label.codeObj=finalValue.value;
													if(label.isBlock=finalValue.value.isBlock){
														//label.isNonMeta=false;
														label.code=finalValue.value.code;
														if(label.isFunction=finalValue.value.isFunction){
															label.parameters=finalValue.value.parameters;
														}
													}
												}
											break;//BODGED, not sure if "=" works in every case. 
											case"=>"://weak equals | set block references | &a.block = &b.block;
												//label.scopes.let=undefined;
												//label.scopes.var=undefined;
												//label.scopes.parent=finalValue.value;
												if(1)if(finalValue.value.isBlock){
													label.isBlock=true;
													label.code=finalValue.value.code;//[...finalValue.value.code];
												};
												if(0){
												label.code=finalValue.value.code;
												label.isBlock=finalValue.value.isBlock;
												label.parameters=finalValue.value.parameters;
												label.isFunction=finalValue.value.isFunction;
												}
											break;
											case"<=":
												if(1)if(finalValue.value.isBlock){
													label.isBlock=true;
													label.code=[...finalValue.value.code];
												};
												if(0){
													label.code=[...finalValue.value.code];
													label.isBlock=finalValue.value.isBlock;
													label.parameters=[...finalValue.value.parameters];
													label.isFunction=finalValue.value.isFunction;
												}
												errorLog("WARNING: use of experimental features. the use of the operator:'<' is not fully desided yet");
											break;
											case"->"://set def's refferences | &a.address = &b.address;
												label.codeObj=finalValue.value;
											break;
											case"<-":{
												label.codeObj=finalValue.value.codeObj;//undesided on what it should do
												errorLog("WARNING: use of experimental features. the use of the operator:'<-' is not fully desided yet");
											}break;default:
											errorLog([match[0]]);
											throw Error("logic error in .js: expected assignment symbol, got:'"+match[0]+"' check\n\tswitch(match[0])\n\tand\n\t['=','=>','->',etc...].includes(match[0])\nthis is not a 0xmin error.\n");
										}
										if(finalValue.number!=undefined)switch(match[0]){//#a=b+3;
											case"=":
											label.relAddress=finalValue.number;//not sure on this mechanic
											break;
											default:
											if(finalValue.value)label.relAddress=finalValue.number;//not sure on this mechanic
											else label.relAddress+=finalValue.number;
										}
									}//label.address=finalValue.value.address;
									else {
										//errorLog(finalValue);
										//throw new Error(errorMsg+throwErrorLine(codeObj)+' unhandled expression: "'+codeObj.croppedSource +'"'+throwErrorFile(codeObj));
										break parsingBlock;
									}
									return{label,didParse};
								}}
								words.i=oldI;
								return{label,didParse};
							};parseSetStatement.test=({words})=>["=>", "<=", "=", "->", "<-"].includes(words[words.i][0]);
							const commentLastStatemets=function(scope,num=1){//semi-comment out the "...block;" --> "#(){...block}" 
								let str;
								//scope.codeBlock.code.pop();
								scope.code.push(
									Object.assign(new String(str="\x1b[32m#CONTAINER:(){\x1b[0m"),{croppedSource:str}),
									...scope.code.splice(scope.code.length-num,num),
									Object.assign(new String(str="}"),{croppedSource:str}),
								);
							}
						//----
						if(words.length==0)break ifBlock;
						let addToNonMeta=false;
						//import
						if(words[0]?.[0]=="import"){
							isMeta=true;
							addToNonMeta=false;
							codeObj.isNonMeta=false;
							words.i++;
							let args=[];
							let throwStarter=errorMsg+throwErrorLine(codeObj)+". Incorrect import syntax. ";
							let folderRegex=/[\s\S]*?(\/(?=[^\/]*$))/;
							const modes={
								main:new String(mainFileName.match(folderRegex)?.[0]??""),
								self:new String(    fileName.match(folderRegex)?.[0]??""),//file address relative to this file
								library:new String(jsFolderDir+"/../include/"),//a lib
								compiler:new String(""),
							}
							let addressMode=modes.self;
							if(words[words.i]){
								//NOT FINISHED
								//throw new Error(throwErrorLine(codeObj)+'compiler bug: \'import words"folder/fileName" \' is not supported yet '+throwErrorFile(codeObj));
								switch(words[words.i][0]){//mode
									case"main":addressMode=modes.main;break;
									case"lib":addressMode=modes.library;break;
									//case"caller":addressMode=modes.parent;break;
									case"this":addressMode=modes.self;break;
									default:addressMode=modes.compiler;
								}
							}
							let newfileNames=[];
							let n=1;
							for(let i=partI+1;i<parts.length;[i++,n++]){
								let match;
								if(parts[i] instanceof Str){
									newfileNames.push(addressMode+JSON.parse(parts[i]));//Path.join(...addressMode,...(""+JSON.parse(parts[i])).split("/"));
									i++;
								}
								if(match=parts[i].match(/^\s*,\s*$/)){
									continue;
								}
								else if(match=parts[i].match(/^\s*;\s*$/)){
									if(match[0].length==1){//"import 'file' ;"
										break;
									}
									else{//"sa dasf gd ;"
										throw new Error(throwStarter+"Not allowed extra statements in a import statement"+throwErrorFile(codeObj));
									}
								}
								else if(parts[i].match(/^\s*,?\s*$/)){//'import "A.0xmin" "B.0xmin", "C.0xmmin";'
									;
								}else{
									throw new Error(throwStarter+""+throwErrorFile(codeObj));
								}
							}
							commentLastStatemets(scope,n);
							async function oxminImport({newfileName,scope,fileName,callStack}){
								if(fileList[newfileName]!=undefined){
									throw new Error(errorMsg+"file already imported:"+newfileName+throwErrorFile(fileName))
								}
								let file=fileList[newfileName]=await oxminCompiler.fileLoader(newfileName);
								await parseFunction({scope,codeScope:scope,parts:getPartsFromFile(file),fileName,callStack});
							};
							for(let newfileName of newfileNames){
								await oxminImport({newfileName,scope,fileName,callStack});
							}
						}
						else if(isMeta){
							addToNonMeta=true;//isMeta"#" is parsed similar to non-meta code
						}
						else{
							addToNonMeta=true;
						}
						if(addToNonMeta){
							let addToNonMeta=true;//true => do the "jump->lbl+2;" parse
							let isremoved=false;
							codeObj.isNonMeta=true;
							words.i=0;
							let command=words[words.i];
							let isVarWord=w=>["def", "let", "var", "set", "..."].includes(w);
							if(isMeta&&["var", "let", "set", "def"].includes(words[words.i][0])){// "let"or "#" in "#a=b" or "var a=b"
								command.number=undefined;
								addToNonMeta=false;
								codeObj.isNonMeta=false;
							}
							switch(words[words.i++][0]){
								case"move":{command.number= 0;command.pointer=scope.getVar().labels.move;}break;
								case"jump":{command.number= 1;command.pointer=scope.getVar().labels.jump;}break;
								case"nor" :{command.number= 2;}break;
								case"red" :{command.number= 3;}break;
								case"blue":{command.number= 4;}break;
								case"get" :{command.number= 5;}break;
								case"set" :{command.number= 6;}break;
								case"if"  :{command.number= 7;}break;
								case"null":{command.number=30;}break;
								case"NaN" :{command.number=NaN;}break;
								default:
								command.number=undefined;
								//words.i==0
								words.i--;
							}
							if(command.number==undefined){//"label->pointer;" or ";"
								//addToNonMeta=true;
								let label;
								command.number=undefined;
								if(!isVarWord(words[words.i][0])){//strToNumber
									let oldI=words.i;//test for "lbl->pointer" or "lbl=label"
									let isDebugger=words[words.i]?.[0]=="debugger";
									({label}=await parseLabelOrNumber({words,scope,codeObj,makeVars:false}));
									if(!isNaN(label)){//"0x1234;"
										command.number=+label;
									}
									else if(label instanceof Scope){
										command.pointer=label;
										if(isDebugger||label.isDebugger){
											addToNonMeta=false;
											words.i=oldI;
										}
										if(isMeta&&(await parseSetStatement({possiblyNonMeta:true,words,scope,codeObj,label})).didParse){
											words.i=oldI;
											codeObj.isNonMeta=false;
											addToNonMeta=false;
										}
									}
								}else{
								}
								if(0){//old version
									words.i--;//words.i==0
									if(!isNaN(strToNumber(words[words.i][0]))){//"0x1234;"
										command.number=+words[words.i][0];
										words.i++;
									}
								}
							}
							//??findLabel(scope,command[0])
							let jumpOpand,jumpOpandFrom=command.pointer,moveOffsets=[0,0];//[+from,+to]
							let jumpOpcode;
							let pointerOperators=["->", "<-", "=>", "<=", "="];
							//
								let arg;
								const parseOffsetNumbers=(n)=>{
									arg=strToNumber(words[words.i]?.[0]);//n:["move +1 -> x;", "move -> x +1"]
									if(!isNaN(arg)){//"move label -43 ->label2;" same as: "#move->label;#move-43;move->label2;""
										moveOffsets[n]=arg;
										words.i++;
									}
									return arg;
								}
							//
							//psudo regex: ignoring spaces "\s*" and "\s+". also "{{word}}" would be "\b\w+\b".
							//where {{label}} can be: "abc.def" or "_lbl23". {{label}} includes functions and blocks
							let isPointerName=w=>["jump", "move"].includes(w); 
							//non meta parse
							if(words[words.i]&&addToNonMeta){//psudo regex:/^ (jump|move) ({{number}}? (->|=>) {{label}} {{number}})? {{number}}/
								if(!isVarWord(words[words.i][0])){//"jump +4" or "jump label"
									({label:arg}=await parseLabelOrNumber({words,lineStr,pointerOperators,scope,codeObj}));
								}
								if(!isNaN(+arg)){//jump +4
									jumpOpand=arg;
									jumpOpand.number=+arg;
								}else if(arg instanceof Scope||arg instanceof Pointer){
									jumpOpand=arg;
									parseOffsetNumbers(0);//jump label +4 
								}
								if(words[words.i]&&pointerOperators.includes(words[words.i][0])&&words[words.i+1]){//jump->B
									if(words[words.i][0]=="=>")command.moveMode="=>";
									else command.moveMode="->";
									jumpOpandFrom=jumpOpand??jumpOpandFrom;
									words.i++;
									//words[words.i] = B
									jumpOpand=words[words.i];
									({label:arg}=await parseLabelOrNumber({words,lineStr,pointerOperators,scope,codeObj}));//jump -> label;
									if(!isNaN(+arg)){//jump -> +5;
										let word=jumpOpand[0];//for +/- or no sign;
										jumpOpand=arg;//parse int (jump->+5;)
										jumpOpand.type="number";
										jumpOpand.word=word;
										jumpOpand.number=+arg;//TESTING
									}
									else if(arg){//arg instanceof Scope||Pointer
										jumpOpand=new String(arg.name);
										jumpOpand.label=arg;
									}
								}
								parseOffsetNumbers(1);
							}
							codeObj.debug=await debuggingTool.parse({scope,words,codeObj,parts});//a function that runs in the non-meta phase
							//meta parse
							if(words[words.i]){//psudo regex:repeats of: /((var (def)?|let (def)?|set (def)?|def (var|let|set)?)? (({{label}} ((=>|<=|->|<-|=) {{label}})?) ({{label}} ((=>|<=|->|<-|=) {{label}})?)*)/g
								
								let hasDef=false;
								let varType=false;
								let setMode=false;
								{//if(isVarWord(words[words.i][0])){
									//words.i++;//words[words.i]= a label;
									//words.splice(words.i,1,...words[words.i][0].split(",").map(v=>v.match(/[\w\W]*/)));
									for(let i=0;i<words.length&&words.i<words.length;i++){
										if(isVarWord(words[words.i][0])){
											switch(words[words.i][0]){
												case"def":
													hasDef=true;//Infinity;//2;
													//varType=false;
												break;
												case"let":
													varType="let";
												break;
												case"var":
													varType="var";
												break;
												case"...":
													varType="...";
												break;
												case"set"://i think "#set a=b;" is obsilete
													varType=false;
													setMode="set";
												break;
											}
											words.i++;
											continue;
										}
										{
											let label,block;{//#var label
												({label,block}=await parseLabelOrNumber({lineStr:words[words.i].input,scope,codeObj,words,makeVars:false}));
											};
											if(!isNaN(label)){
												label=new Scope({parent:scope,name:label});
												label.scopes.parent=scope;
												block??=scope;
											}
											if(label){
												//label.codeObj=codeObj;label.address=0;
												if(varType=="..."){//concat lbl.code and lbl.labels. runs code
													varType=false;
													if(!isremoved){
														isremoved=true;
														codeObj.isNonMeta=false;
													}
													codeObj.isMeta=true;
													//isMeta=true;
													label.parent=scope;
													let code=[...label.code];code.pop();//remove "}"
													Object.assign(scope.getLet().labels,label.labels);
													commentLastStatemet(scope);
													await parseFunction({scope,codeScope:scope,parts:code,fileName,callStack,functionLine:code[0]?.sourceLineNumber});
													label=undefined;
												}else if(varType=="set"){

												}
												else if(varType||(!findLabel(scope,label.name)&&!strictMode&&0)){
													
													//({label}=await letvarPhrase(words,varType));
													if(1){
														let block1;
														let newLabel=cloneForNewLabel(label);
														if(varType=="let"){block1=block.getLet();}
														else if(varType=="var"){block1=block.getVar();}
														else {block1=scope;}
														newLabel.scopes.parent=block1;
														block1.labels[label.name]=newLabel;
														label=newLabel;
													}
												}
												({label}=await parseSetStatement({label,words,block,codeObj,scope}));
												if(label?.isBlock){
													label.parent=scope;
													let newScope=label;
													newScope.isMeta=false;
													if(hasDef)codeObj.label=label;// also works. adds code to 'foreachCode()'
													//scope.code.pop();scope.code.push(label);
													if(!isremoved){//REMOVE obsilete system "isremoved"
														isremoved=true;
													}
													if(command.number==undefined){//"def block;" and not("1234 def block;")
														codeObj.isNonMeta=false;//remove line from code. allows block.
													}
												}
												if(hasDef){
													label.codeObj=codeObj;
												}
											}
											if(words[words.i]?.[0]==","){
												words.i++;
												continue;
											}else{
												varType=false;
												hasDef=0;
											}
										}
									}
								}
							}
							if(jumpOpand==undefined){//if(isNaN(+jumpOpand)){
								jumpOpand=new String("0");
								jumpOpand.number=0;
							}
							for(let i=0;i<words.length;i++){
								let word=words[i];
							}
							codeObj.command=command;
							codeObj.jumpOpand=jumpOpand;
							codeObj.jumpOpcode=jumpOpcode;
							codeObj.jumpOpandFrom=jumpOpandFrom;
							codeObj.moveOffsets=moveOffsets;
						}
						codeObj.isMeta=isMeta;
					}
				}
				sourceLineNumber=oldSourceLineNumber+[...lineStr.matchAll("\n")].length;;
				index+=parts[i].length;
			}
			if(i>=bail){
				throw Error(errorMsg+"bailed. Possibly a compiler bug.");
			}
			callStack.pop(scope.name);
		};
		await parseFunction({scope,parts,fileName,callStack,codeScope:scope});
		if(globalScope!=scope){
			throw new Error(errorMsg+"scope:'"+scope.name+"' unballanced brackets. File does not end in global scope. Try adding more '}'s to the end of the file.")
		}
		parsed.scope=scope;
	//assign codeObj.lineNumber's and nonMeta pass
		let circleKey=Symbol("reference loop");
		scope.relAddress=0;
		let metaLevel=0;
		//note: scope.nonMetaCode is NOT used
		//only uses "scope.code" and might use "codeObj.code"
		let foreachCode=function*spider(scope){//scope or codeObj
			for(let i of scope.code??scope.label?.code){//codeObj
				let isMeta=i.isMeta;
				if(isMeta)metaLevel++;//continue;
				yield [i,scope];
				if(i.label?.code){
					yield*spider(i.label);
				}
				else if(i.code){//REMOVE: codeObj.code is only for reading function: "parts"
					//yield*spider(i);
				}
				if(isMeta)metaLevel--;
			}
			if(0)for(let i in scope.labels){
				let lbl=scope.labels[i];
				if(lbl==scope)continue;
				if(lbl.code){
					yield*spider(lbl);
				}
				else if(lbl.label?.code){
					yield*spider(lbl.label);
				}
			}
		};
		let nonMetaCode=[];
		{
			let lineNum=0;
			nonMetaCode=[];
			for(let [i,s] of foreachCode(scope)){
				i.lineNumber=lineNum;
				if(i.labels?.jump){
					i.labels.jump.address=i.lineNumber;
				}
				if(i.isNonMeta&&!(i+"").match(/{|}|^\s*;$/)&&!i.label&&metaLevel==0){//!i.code&&!(i instanceof String&&i.label?.code)){
					lineNum++;
				}
				if(i.isNonMeta){
					//if(metaLevel!=0)i.isMeta=true;
					nonMetaCode.push({codeObj:i,isMeta:metaLevel});
				}
			}
		}
		//non-meta pass
		let hasWarned=false;
		(function nonMetaPass(){
			let state=OxminState.state=new OxminState();
			for(let i=0;i<nonMetaCode.length;i++){
				let isJumping=false;
				let codeObj=nonMetaCode[i].codeObj;
				let isMeta=nonMetaCode[i].isMeta;
				Scope.currentCodeObj=codeObj;
				codeObj.computerState=new OxminState({
					jump:findLabel(codeObj.parent,"jump").address,
					move:findLabel(codeObj.parent,"move").address,
				});
				let dif;
				const movePointers=(dif)=>{
					if(codeObj.command.pointer){
						if(codeObj.command.pointer.name!="jump"){
							codeObj.command.pointer.address+=dif;//move pointer
						}else if((codeObj.command?.moveMode+"").match("=>")){
							findLabel(codeObj.parent,"jump").address+=dif;
							isJumping=true;
						}
					}
					codeObj.jumpOpand.value=dif;
					if(Math.abs(dif)>0xff){
						throw Error(errorMsg+throwErrorLine(codeObj)+"val:'"+dif+"'. abs("+dif+") > 0xff. Try adding '"+codeObj.command[0]+"+-"[+(dif<0)]+"'"+"0xff;"+throwErrorFile(codeObj));//"cannot move more than 256"
					}
				};
				if((codeObj+"").match(/\s*set/)&&codeObj.args){//set label=>jump;
					//unfinished
					codeObj.args[0];
					if(codeObj.args[0]){

					}else if(codeObj.args[0]){

					}
				}
				if(codeObj.jumpOpand!=undefined&&(codeObj+"").match(/->|=>/)){
					if(codeObj.command.pointer?.name=="jump"&&(codeObj+"").match("->")){
						//codeObj.command.pointer.address=codeObj.lineNumber;
					}
					if(codeObj.jumpOpand instanceof Number){//move-> +4;
						//DELETE note:handled by offsets(i think)
						//codeObj.jumpOpand.number=codeObj.jumpOpand+codeObj.lineNumber;
					}if(codeObj.jumpOpandFrom instanceof Number){//move+4-> lbl;
						//codeObj.jumpOpandFrom.number=codeObj.jumpOpandFrom+codeObj.lineNumber;
					}
					dif=(codeObj.moveOffsets[1]-codeObj.moveOffsets[0])//"+1" and "-2" in 'move +1 -> -2;'
						+(codeObj.jumpOpand.label?.address??codeObj.lineNumber+codeObj.jumpOpand.number)
						-(codeObj.jumpOpandFrom.address??codeObj.lineNumber+codeObj.jumpOpandFrom.number);//codeObj.command.pointer.address;
					movePointers(dif,true);
				}else{
					dif=+(codeObj.jumpOpand.number??codeObj.jumpOpand.label);
					movePointers(dif);
				}
				let isNegative=(codeObj.jumpOpand?.word??"").match("-")||+codeObj.jumpOpand.value<0;
				let handleOxminQuerk=(codeObj.command.pointer?.name=="jump" && isNegative&&-codeObj.jumpOpand.value&1);//jump negative uses a +ve first bit and 7 -ve bits
				codeObj.toValueValue=0*(+codeObj.jumpOpand.value)+codeObj.command.number + (!isNegative?0:0x1000) + (0xff&Math.abs(+codeObj.jumpOpand.value)+2*handleOxminQuerk)*0x10;
				
				if(!isMeta&&!isJumping){
					findLabel(codeObj.parent,"jump").address++;
				}
			}
		})();
	//find (!isMeta) binary code
		let codeCollector=function*(scope){//ignore "codeObj.isMeta"
			for(let i of scope.code){//codeObj
				if(i.isMeta)continue;
				if(i.toValueValue!=undefined){let codeObj=i;
					if(isNaN(codeObj.toValueValue)){
						callStack[0]=new CallStackObj({fileName:codeObj.fileName})
						if(hasWarned++<2)console.warn(//throw new Error(
							(errorMsg+"line "+codeObj.sourceLineNumber+":'")+codeObj.match(/[^\n\t].*/)[0]+"': value is NaN "+throwErrorFile(codeObj.fileName)
						);
					}
					yield i;//lineNumber??-1;//
				}
				//if(i.code)yield*codeCollector(i);
				if(i.label)yield*codeCollector(i.label);//for block scopes "{}" "labelName{}"
			}
		}
		parsed.codeList=[...codeCollector(parsed.scope)];
		parsed.outputFile=parsed.codeList.map(v=>v?.toValueValue);
		if(buildSettings.drawTable)console.table(parsed.codeList.map(v=>{
			let str=(+v.toValueValue).toString(16);
			//[line number,0bmin,0xmin]
			return{
				n:"0x"+v.lineNumber.toString(16),
				//filt:"0x"+str,
				cmd:recompileBin(v.toValueValue),
				state:{j:"0x"+v.computerState.jump.toString(16),m:"0x"+v.computerState.move.toString(16)},
				line:v.sourceLineNumber,
				source:(""+v).replace(/^[\s]*/g,"").replaceAll(/\s/g," "),
			};
		}));
		console.log("length:"+parsed.codeList.length);
	//----
	if(buildSettings.logFinalCode)console.log(parsed.outputFile.map(v=>{
		v=v.toString(16);
		v=new Array(Math.max(0,0-v.length)).fill(" ").join("")+v;
		return v;
	}).join(","),...[[],["made file"]][+buildSettings.makeFile],);
	parsed.outputBinary=new Uint32Array(parsed.outputFile);
	return parsed.outputBinary;
};
let outputFile=null;
let jsFolderDir=process.argv[1].split("/");jsFolderDir.pop();jsFolderDir=jsFolderDir.join("/")
let halter=setTimeout(()=>{if(!outputFile)throw errorMsg+"compiler timed out (1 second)";halter="done";},1000);
if(process.argv.length<3||!process.argv[2].match(/\.0xmin$|compile.js/)){
	[
	  '...node',//node.js
	  '...compile.js',//
	  '...inFile.0xmin',
	  '...outFileName.out',
	]
	clearTimeout(halter);
	console.error(errorMsg+"needs input .0xmin file");
	return;
	throw "needs input .0xmin file";
}
else{
	const fs = require('fs');
	oxminCompiler.fileLoader=fileName=>new Promise((resolve,reject)=>{fs.readFile(fileName, 'utf8' , (err, data) => {
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
			//process.argv[3]="testCode.filt"
		}
		let inputFile=await oxminCompiler.fileLoader(fileName);
		return [inputFile,fileName];
	})();
	let fileWriter=()=>new Promise((resolve,reject)=>{//minFilt.lua or a.filt
		if(!buildSettings.makeFile){resolve("no file");return;}
		let newFileName=process.argv[3]??"minFilt.lua";//??"a.filt"??"minFilt.lua";
		let fileType=newFileName.match(/(?<=\.)[^.]*$/)?.[0]??"filt";
		let content=outputFile;
		if(fileType=="lua"){
			let varName=newFileName.replaceAll(".", "_");
			content="minFilt={"+outputFile+"}";
			//console.log("variable name:",varName);
		}
		fs.writeFile(newFileName, content, err => {
			if (err) {
				reject(err);
			}
			if(fileType=="lua"){
				;
			}
			//file written successfully
			resolve();
		})
	});
	(async function(){
		let [inputFile,fileName]=await fileLoader;
		outputFile=null;
		outputFile=await oxminCompiler(inputFile,fileName);
		await fileWriter();
		clearTimeout(halter);
		return outputFile;
	})();
}
//.catch(error=>{});
//return 42;
return "hello world";//outputFile;
let example0xminFile=`
	"make file";
	"log table";
	"!log.code";//does: output=not(input_value)
	jump+2;
	#var input_value;
	123 def input_value;
	move->input_value;
	get;
	nor;
	#var output;
	move->output;
	#var next;
	jump->next;
	def output;
	def next;
	set;//
`;
/*
Error: this.codeObj is undefined
/home/jack84t/Documents/0xmin_stff/compilers/compile.js:140
					throw new Error(errorMsg//error 
					      ^

Error:  0xmin-ERROR :: line 49: '{' , label:'undefined' is probably not defined. Try adding: '1234 def undefined;'
    at Scope.get address [as address] (/home/jack84t/Documents/0xmin_stff/compilers/compile.js:140:12)
    at oxminCompiler (/home/jack84t/Documents/0xmin_stff/compilers/compile.js:666:28)
    at /home/jack84t/Documents/0xmin_stff/compilers/compile.js:747:14
*/
/*
	#var function(asd){
		//0x111111;
		jump->asd;
		#def move->return;
	}
	#let a;
	def function(a);
	2 def a;
	move-> a;
*/