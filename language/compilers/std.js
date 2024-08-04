//javascript version of `std v1.0xmin` done to improve speed
module.exports=({
	Language,
	contexts,
	assemblyCompiler,
	AssemblyLine,
	Scope,
	HiddenLine,
	MetaLine,
	Variable,
	BuiltinFunction,
	BuiltinFunctionFunction,
	throwError,
	Value,
	loga,
	mainObjectGetter,
	valueCharToNumber,
})=>{
	let registerSymbol;
	function isRegister(label){//:Variable?
		return label?.labels[registerSymbol]??null;
	}
	let std = new Variable({
		name:"std",
		labels:{
			"RegEnum":new BuiltinFunction("RegEnum",({args,statement,scope})=>{
				if(regEnum.lineNumber>=14)throw Error(throwError({index:undefined,statement,scope},"#std.js:","out of registers"));
				let regEnum = new BuiltinFunction("<RegEnum>",
					({args})=>new Variable({
						name:"<<RegEnum>>",
						lineNumber:regEnum.lineNumber++,
						functionPrototype:regEnum.supertype,
						functionSupertype:regEnum.prototype,
						functionOperators:regEnum.operators,
						functionConstructor:regEnum,
					}),
					{lineNumber:0}
				);
				return regEnum;
			},
			"for":new BuiltinFunction("for",({args,callingValue,scope,statement})=>{
				let i = isRegister(args[0])?args[0]:args[0]?args[0].call({
					args:{list:[],obj:{}},
					value:callingValue,callType:undefined,scope,statement,
				})??null;
				let entry = new Variable({name:"entry"});
				throw Error("TODO");
			}),
			"meta":new Variable({name:"meta",labels:{
				"assert":new BuiltinFunction("assert",({args})=>{
					throw Error("TODO");
				}),
				"forEach":new BuiltinFunction("forEach",({args})=>{
					throw Error("TODO");
				}),
				"repeat":new BuiltinFunction("repeat",({args})=>{
					throw Error("TODO");
				}),
			}}),
		}
	});
	return std;
}