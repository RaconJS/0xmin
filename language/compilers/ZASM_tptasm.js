module.exports=({Language,contexts,assemblyCompiler,AssemblyLine,Scope,HiddenLine,MetaLine,Variable,throwError,Value,loga,mainObjectGetter})=>
	new class InstructionSet extends Language{
		//main_assembly:#()->{@}
		//compileAssemblyLine:@(@)->{0}
		//assemblyLineToLabel:(AssemblyLine)->Variable
		//setLanguage:({context})->void
		//
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
				map:{"add":["adc", "+"], "adds":["adcs", "+"], "sub":["sbb", "+"],"subs":["sbbs", "+"]},
				defaultSymbols:[""],
			},
			"store":{
				map:{"add":"adds", "addc":"addcs", "sub":"subs", "sbb":"sbbs", "and":"ands", "xor":"xors", "or":"ors"},
				defaultSymbols:["", "!"],
			},
			"internal":{
				map:{"shl":"scl", "shr":"scr"},
				defaultSymbols:["", "+"],
			},
			"chain":{
				map:{"shl":"scl", "shr":"scr"},
				defaultSymbols:["", "+"],
			},
			"signed":{
				useArray:true,
				map:{"jg":["ja", "!"], "jl":["jb", "!"], "jge":["jae", "!"], "jle":["jbe", "!"]},
				defaultSymbols:["", "!"],
			},
		});
		operatorsToCheckForNoStore=Object.freeze([
			"+", "-", "&", "|", "^",
		]);
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
			"adc":"adc",
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
			"ja":"ja",
			"jb":"jb",
			"jae":"jae",
			"jbe":"jbe",
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
			let wasFound=false;
			if("+-!".includes(statement[index])){
				hasSymbol=true;
				symbol=statement[index++];
			}
			if(this.optionals.hasOwnProperty(optional=statement[index])){
				optionals[optional]=symbol;
				index++;
				wasFound = true;
			}
			else if(hasSymbol)index--;
			return {index,failed:!wasFound};
		}
		asm_NumberOrRegister({statement,index,scope},{arg}){//#:
			let failed,macro;
			if(statement[index]==this.registerSymbol||statement[index]=="r"){
				index++;
				arg.push("r");
			}else if(this.registers.hasOwnProperty(statement[index])){
				arg.push(this.registers[statement[index++]]);
				return {index};
			}
			if(this.otherKeywords.hasOwnProperty(statement[index])){
				arg.push(statement[index++]," ");
			}
			if(!({index,macro,failed}=this.handleMicroAssemblyMacros({statement,index,scope})).failed){
				arg.push(...macro);
				return{index};
			}
			let value;
			({index,value}=contexts.expression_short({statement,index,scope,noSquaredBrackets:true}));
			if(value){arg.push(value);}
			return {index};
		}
		asm_operator({statement,index,scope,operator,optionals,hasAssignment}){//#:string|undefined
			let word=statement[index];
			let hasOverwritableOperator;//:bool
			if(!hasOverwritableOperator&&this.operators.hasOwnProperty(word)&&this.operators[word]!=null){
				let oper1=word;
				index++;
				if((oper1.match(/^\W+$/)||1)&&["=", "->"].includes(statement[index])){//'a + = b'
					index++;//note: '=' is not required for 'a oper= b' although it is recomended for strict syntax
				}
				else if(!hasAssignment){//'a + b' --> 'a + = b !store'
					let operName=this.operators[oper1];
					if(this.operatorsToCheckForNoStore.includes(oper1)){
						optionals["store"]="!";
					}
				}
				if(oper1=="="||oper1=="=>"){//'%register = pop;'
					word=statement[index];
					if(["pop", "recv", ""].includes(word)){
						oper1=word;
						index++;
					}
				}
				if(!operator||this.operators[oper1]!="jmp")operator=this.operators[oper1];
				if(oper1=="="){
					hasAssignment=true;
					hasOverwritableOperator=false;
				}
				else hasOverwritableOperator=true;
			}
			return {index,operator,hasOverwritableOperator,hasAssignment};
		}
		asm_arg({statement,index,scope}){//#:(string|Value)[]
			let word=statement[index];
			let value;//:Value
			let arg=[];//:(string|Value)[]
			if(word=="["){
				index++;
				word=statement[index];
				arg.push("[");
				for(let i=0;i<word.length&&i<1;i++){
					let statement=word[i],index=0;
					({index}=this.asm_NumberOrRegister({statement,index,scope},{arg}));
					if("+-".includes(statement[index])){
						arg.push(statement[index++]);
						({index}=this.asm_NumberOrRegister({statement,index,scope},{arg}));
					}
				}
				index+=2;
				arg.push("]");
			}
			else{
				({index}=this.asm_NumberOrRegister({statement,index,scope},{arg}));
			}
			return {index,arg};
		}
		asm_assignment({statement,index,scope,operator}){
			let word=statement[index];
			let hasAssignment;
			if(word=="="){
				hasAssignment=true;
				index++;
				if(!operator)operator = this.operators[word];
			};
			return {index,hasAssignment,operator};hasAssignment
		}
		///interface
		handleMicroAssemblyMacros({statement,index,scope}){//'@$label' ; for 'a{[r1]};@$a=b' --> '@[r1]=b'
			let failed=true,macro=[];
			if(statement[index]=="$"){
				failed=false;
				index++;
				let value;
				({value,index}=contexts.expression_short({statement,index,scope,noSquaredBrackets:true}));
				value.toType("label");
				if(!value.label)throw Error(throwError({statement,index,scope}, "# type", "label '"+value.name?.toString?.()+"' is unassigned"));
				let {label}=value;
				flattenTree(label);
				function flattenTree(label){//uses macro
					if(label.isSearched1)return;
					label.isSearched1=true;
					for(let codeObj of label.code){
						if(codeObj instanceof AssemblyLine){
							let args = codeObj.args;
							//assume will always at least have 'dw' or another instruction at `args[0]`. This works for tptasm.
							if(args[0]=="dw")args=args.slice(1,args.length);
							macro.push(...args);
						}
						else if(codeObj instanceof Variable){
							flattenTree(codeObj);
						}
						else if(codeObj instanceof Scope)continue;
						else if(codeObj instanceof HiddenLine)continue;
						else if(codeObj instanceof MetaLine)continue;
						else continue;
					}
					label.isSearched1=false;
					delete label.isSearched1;
				}
			}
			return {index,macro,failed};
		}
		generateAssemblyLine({statement,index,scope}){//:void & mutates scope
			const instruction=new AssemblyLine({scope});
			let argsList=[];
			let hasIf=false,hasOverwritableOperator=false,hasAssignment=false;//note: hasOverwritableOperator excludes '=' to allow for 'a=b+c' --> 'add a,b,c'
			let operator,args=[],optionals={};//optionals:Map
			for(let i=0;i<12;i++){
				let arg;
				if(!hasIf)({index,operator,hasIf}=this.asm_ifStatement({statement,index,scope,operator,hasIf}));
				if(!hasOverwritableOperator)({index,operator,hasOverwritableOperator,hasAssignment}=this.asm_operator({statement,index,scope,operator,optionals,hasAssignment}));
				//if(!hasAssignment)({index,operator,hasAssignment}=this.asm_assignment({statement,index,scope,operator,optionals}));
				{
					let failed;
					({index,failed}=this.asm_optionalStatement({statement,index,scope,optionals}));
					if(!failed)continue;//allow for 'if>0!signed jump->x'
				}
				if(args.length<3){
					({index,arg}=this.asm_arg({statement,index,scope}));
					if(arg?.length>0){args.push(arg);}
					if(statement[index]==","&&args.length==1)index++;//'mov a,b;'
				}
				let word=statement[index],failed;
				if(({index}=contexts.endingSymbol({index,statement})).failed){break;}
			}
			if(args.length>1){for(let i=1;i<args.length;i+=2)args.splice(i,0,",");}
			if(!operator){
				//args[0][0]:Value
				let dataMask=0xffff;
				operator="dw";
				if(args.length==1){
					if(args[0][0].type=="string"&&args[0][0].array.length>0){
						let instruction=[];//new Variable({name:"(string)"});
						for(let char of args[0][0].array){
							let newLine=new AssemblyLine({scope,type:"data",dataType:"char",args:[operator,(valueCharToNumber(char,true)&dataMask)+""]});
							newLine.dataValue=+newLine.args[1];
							instruction.push(newLine);
						}
						return {index,instruction,isArray:true};
					}
					else{
						instruction.type="data";
						instruction.dataType="number";
						instruction.dataValue=args[0][0].number;//:number
					}
				}else throw Error(throwError({statement,index,scope},"#/@ syntax", "invallid assembly line: expected a string, a number or a command."));
			}
			else{
				for(let i in optionals){//optionals[number]:string & symbol
					if(!optionals.hasOwnProperty(i))continue;
					let optionalObj=this.optionals[i];//:{}
					let fail=true;
					if(!optionalObj || !optionalObj.map.hasOwnProperty(operator)){
						let possibilitiesList=Object.keys(this.optionals).filter(i=>this.optionals[i].map.hasOwnProperty(operator));
						throw Error(throwError({statement,index,scope},"@ syntax", "cannot use '"+i+"' with the '"+operator+"' instruction. You can try using one of: "+possibilitiesList));
						//TODO: add symbol types to the 'try doing ...' to this error message
					}
					if(optionalObj&&(
						optionalObj.defaultSymbols.includes(optionals[i])||//if valid symbol used with keyword
						(optionalObj.useArray&&optionalObj.map[operator]?.[1]==optionals[i])
					)){
						if(optionalObj.useArray)operator=optionalObj.map[operator][0]??operator;
						else operator=optionalObj.map[operator]??operator;
					}
					else{
						throw Error(throwError({statement,index,scope},"@ syntax", "cannot use '"+optionals[i]+"' symbol with '"+i+"' option for the '"+operator+"' operator."));
					}
				}
			}
			{
				argsList=[operator,...args.flat()];
				instruction.args=argsList;
			}
			return {index,instruction};
		}
		///interface
		main_assembly({statement,index,scope}){//# tptasm
			({index}=contexts.keyWordList({statement,index,scope,keywords:{}}));
			let instruction,isArray;
			({instruction,isArray,index}=this.generateAssemblyLine({statement,index,scope}));
			if(isArray)//instruction:AssemblyLine[]
				scope.label.code.push(...instruction);
			else //instruction:AssemblyLine
				scope.label.code.push(instruction);
			return {index};
		};
		getLabel({statement,index,scope}){//#
			return (contexts.expression_short({statement,index,scope})).toType(label);
		};
		getArg(value,level=0){//@:(string|Value|Operator)=>(string|Value)[]
			if(level>4)return [];//only allow 4 levels of assembly recursion
			return typeof value=="string"?value:
			typeof value=="number"?""+value:
			value instanceof Value?
				isNaN(value=value.toType("number").number)?
					NaN//Error("label is not assigned")
				:""+value
			:value instanceof Operator?this.doOperator(value,level+1)//TODO: remove this case
			:[];
		};
		compileAssemblyLine({instruction,cpuState,assemblyCode}){//@
			const {mainObject}=mainObjectGetter();
			//asm -> tptasm
			let args=instruction.args;//(string|Value|operator)[]
			let failed=false;
			let tptasmString;
			if(args.length==1&& typeof args[0]=="number"){//for AssemblyLine<number> for: 'def let a=2;'
				args=["dw",args[0]];
			}
			{
				tptasmString=args
					.map((v,i,a)=>{
						if(0){
							if(mainObject.labels["settings"].labels["include_labels"].lineNumber)
							if(a[i-1]!="r" && v instanceof Value&&v.type=="label"&&v.label.defs.length>0&&v.label.defs[0]?.defs?.length>0)
								return assemblyCompiler.getAssemblyLabelName(v.label);
						}
						let v1=this.getArg(v);
						if(!isNaN(+v1)&&a[i-1]!="r"){
							v1="0x"+(0x1fffffff&v1).toString(16);
						}
						failed||=(v1!==v1)?Error(
							(["1st", "2nd", "3rd"][i]??i+"th")+" argument: '"+
							(
								v.label?.name?v.label.name+"' is undefined":
								(v?v.name?.toString?.():v)+"' is undeclared"
							)
						)
						:false;
						return v1+["", " "][+(i==0)]
					})
					.flat()
					.join("")
					.replaceAll(/-?\b([0-9]+)\b/g,(m)=>"0x"+(0x1fffffff&m).toString(16))
					+(
						!mainObject.labels["settings"].labels["include_labels"].lineNumber?""
						:" ; " + args.map(v=>v instanceof Value&&v.type=="label"?
							assemblyCompiler.getAssemblyLabelName(v.label)
							:this.getArg(v)
						).join(" ")
					)
					//.map(v=>v==","? "" :v)
					//.join(",")//:string
					//.replaceAll("%,", "r")//registers
					//.split(",")
				;
			}
			instruction.asmValue=tptasmString;
			{
				cpuState.lineNumber++;
				cpuState.org++;
				cpuState.jump++;
			}
			return {failed};
		};
	}
;