//node.js version 16
//BODGED
//UNFINISHED
//NEEDSTESTING
//TESTING
//TODO
+process.version.match(/[0-9]+/g)[0]>=16;
try {1??{}?.(2)}catch(e){throw Error("This 0xmin compiler requires node.js version 16.")}
function loga(...args){console.log(...args);};
const oxminCompiler=async function(inputFile,fileName){
	const wordsRegex=
	/\/\/[\s\S]*?\n|\/\*[\s\S]*?\*\/|(["'`])(?:[\s\S]*?[^\\])?\1|\s+|[\w_]+|[=-]>|::|\.{1,3}|[&|^]{2}|[!$%^&*()-+=\[\]{};:@#~\\|,<>/?]/g
	;
	//(long string,string) => (array of words)
	function parseFile(inputFile,fileName){
		let words=inputFile.match(wordsRegex);
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
	class Scope extends Array{
		parse(words){//checks grammer
			for(let i=words.i,len=words.length;i<len&&words.i<words.length;i++){
				this.push(new CodeObj().parse(words))
				//assert (word != ';') unless the next line is a ';' statement
			}
			return this;
		}
	};
	class CodeObj extends Array{
		isStatic=false;
		parse(words){
			let maxLen=words.length;
			for(let i=words.i;i<maxLen&&words.i<words.length;i++){
				let word=words[words.i];
				//line types
				switch(word){
					case"repeat":{
						this.push(new Statement.Repeat(words));
					}break;
					case"recur":{
					}break;
					case"void":{
					}break;
					case"":{
					}break;
					case"":{
					}break;
				}
			}
			return this;
		}
	};
	class Statement extends Array{
		parse(words){
			for(let i=words.i,len=words.length;i<len&&words.i<words.length;i++){
				this.push(new CodeObj().parse(words))
			}
			return this;
		}
		static Repeat=class extends Statement{
			parse(words){
				//assert words[words.i] == 'repeat'
				words.i++;
				this.push(new Expression().parse(words));
				return this;
			}
		};
	};
	class Expression extends Array{//'a + b * c' [value1,value2] or '( [v,v] )'
		parse(words){
			for(let i=words.i,len=words.length;i<len&&words.i<words.length;i++){
				let word=words[words.i];
				if(")]},".includes(word)){
					break;
				}
				else{
					this.push(new Value().parse(words));
				}
			}
			return this;
		}
	};
	class Value extends Array{//'a.b.c' ['(',expression,')'] or [name,'.',name]
		hadBrackets=false;
		parse(words){
			if(words[words.i]=="("){
				this.hadBrackets=true;
				words.i++;
			}
			for(let i=words.i,len=words.length;i<len&&words.i<words.length;i++){
				let foundPart=false;
				{
					let word=words[words.i];
					if("\"'`".includes(word[0])){
						this.push(new Word.String(word));
						words.i++;
						found=true;
					}
					else if(words[0].match(/[\w_]/)){//variable name
						this.push(new Word.Name(word));
						words.i++;
						found=true;
					}
				}
				if(foundPart){//symbol part
					foundPart=false;
					if([".",".."].includes(word)){//optional dot operator
						words.i++;
						this.push(new Word(word));
						foundPart=true;
					}
					let word=words[words.i];
					if(!["(","[","{"].includes(word)){
						break;
					}else{
						foundPart=true;
					}
					switch(word){
						case"(":
							words.i++;
							this.push()
						break;
						case"..":
						break;
						case"(":
						break;
					}
				}
				if(words[words.i]==")"&& this.hadBrackets){
					words.i++;
					break;
				}
			}
			return this;
		}
	}
	class Word extends String{
		constructor(word){
			super(word);
		}
		static String=class extends Word{};
		static Name=class extends Word{};
	}
	//chars->words->expresion->statement->codeObj->block
	//
	//(...)
	async function evalExpression(){}
	//{...}
	async function evalFunction({scope,words}){
		let repeat={isRepeating:false,wordI:0,repsDone:0,maxReps:0};
		for(let i=words.i,len=words.length;i<len&&words.i<words.length;i++){
			let word=words[words.i];
			//start of statement
			for(let i=0;i<len;i++){
				switch(word){
					case"repeat":{
					}break;
					case"recur":{
					}break;
					case"":{
					}break;
					case"":{
					}break;
					case"":{
					}break;
				}
			}
		}
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