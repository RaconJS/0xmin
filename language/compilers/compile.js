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
	const bracketClassMap=Object.freeze({
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
			statement.push(words[words.i]);
			words.i++;
		}
		let brackets=0;
		for(let i=words.i,len=words.length;i<len&&words.i<words.length;i++){
			let word=words[words.i];
			if(word in bracketMap){//handle brackets
				statement.push(bracketPass(words,word,true));
			}
			else if(word=="," && type!="{"){
				//';' only belongs to codeObjs, and not expressions
				statement.push(word);
				words.i++;
				block.push(statement);
				statement=[];
			}
			else if(word=="}"||(type!="{" && ";)]}".includes(word))){
				block.push(statement);
				break;
			}
			else if(word == ";" && type=="{"){
				statement.push(word);
				words.i++;
				block.push(statement);
				statement=[];
			}
			else{
				statement.push(word);
				words.i++;
			}
		}
		if(includeBrackets){//[...] => ['{',...,'}']
			loga("??",words[words.i])
			if(words[words.i]!=bracketMap[type])throw Error("unballanced "+type+" brackets");
			statement.push(words[words.i]);
			words.i++;
		}
		return block;
	}
	let parts=bracketPass(parseFile(inputFile,fileName));
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