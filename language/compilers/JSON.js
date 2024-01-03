function deReference(object,classList = []){//:(any,[class,name,toParameters][])->(unknown)[] ; is in prefix order
	let classes = classList.map(v=>v[0]);
	let classNamesUsed = new Set();
	let refsGraph = [];//:(any & graph-like)[]; contains original objects
	let refsTree = [];//: (any & tree-like)[]; contained cloned versions of the references structured like a lambda-calculus expression
	let isSearched = Symbol("isSearched");
	function addItem(clonedValue,value){
		const index = refsGraph.length;
		refsGraph.push(value);
		refsTree.push(clonedValue);
		return index;
	}
	!function cloneValue(value){//:(any)->number & []refs*
		let clonedValue = value;
		let index;
		if(refsGraph.includes(value))
			return refsGraph.indexOf(value);
		switch (typeof value){
			case"undefined":
				clonedValue = "undefined";
				break;
			case"object":{
				if(value == null){
					clonedValue = "null";
					break;
				}
				let object = value;
				if(object.toJSON){
					object = object.toJSON();
				}
				let classObj;{
					let prototype = Object.getPrototypeOf(object);
					if(!Object.hasOwn(object,"constructor")){
						classObj = object.constructor;
					}
					else if(prototype==Object.prototype||!Object.hasOwn(prototype,"constructor")){
						classObj = prototype.constructor;
					}
					else {
						throw Error("Could not find the class name of object")
					}
				}
				clonedObject = [];
				clonedValue = [];//[String,tree-like]
				index = addItem(clonedValue,object);
				clonedValue[1] = clonedObject;
				switch(classObj){
					case Map://json strings do not support maps and sets
						for(let [key,value] of object){
							clonedObject.push([cloneValue(key),cloneValue(item)]);
						}
						break;
					case Set:
					case Array:
						for(let item of object){
							clonedObject.push(cloneValue(item));
						}
						break;
					break;
					default:
					case Object:
						for(let property in object){
							if(Object.hasOwn(object,property)){
								clonedObject.push([cloneValue(property),cloneValue(object[property])]);
							}
						}
						for(let symbol of Object.getOwnPropertySymbols(object)){
							clonedObject.push([cloneValue(symbol), cloneValue(object[symbol])]);
						}
					break;
				}
				clonedValue[0] = cloneValue(classObj);
				return index;
			}
			case"number":
				clonedValue = "number:" + value;break;
			case"string":
				clonedValue = "string:" + value;break;
			case"symbol":
				clonedValue = "symbol:" + value.name;break;
			default:
			break;
			case"function":{
				let index = classes.indexOf(value);
				let name = value.name ?? classList[classes.indexOf(value)]?.[1];
				if(classNamesUsed.has(name))throw Error("repeated function/class name: '" + name + "'")
				clonedValue = "class:" + name;
			}
		}
		return addItem(clonedValue,value);
	}(object);
	return {
		originals:refsGraph,
		cloned:refsTree,
	};
}
function parseList(refs,classList){
	let classNames = new Map();//:maps String -> class
	classList.forEach(v=>classNames.set(v[1]??v[0].name, v[0]));
	//assume prefix order
	function handleObject(reference,i){
		for(let i in reference){
			if(Object.hasOwn(reference,i)){
				if(typeof reference[i] == "number"){
					reference[i] = refs[reference[i]];
				}
			}
		}
	}
	const refTypeMap = {
		"number:"(v){return +v;},
		"string:"(v){return ""+v;},
		"symbol:"(v){return Symbol(v);},
		"class:"(v){return classNames.get(v);},
		"null"(v){return null;},
		"undefined"(v){return undefined;},
	};
	generateObjects:
	for(let i = 0; i < refs.length; i++){//reference:number|Object|Array|
		let reference = refs[i];
		if(typeof reference == "string"){
			let match = refs[i].match(/^.+:/);
			refs[i] = refTypeMap[match[0]](refs[i].substr(match[0].length));
		}
		else if(reference instanceof Array){
			let name = refs[reference[0]];//:String
			let match = name.match(/^.+:/);
			name = name.substr(match[0].length);
			let properties = reference[1];//:[key:number,value:number][] | [value:number][]
			let classObj = {
				"Object":Object,
				"Array":Array,
				"Map":Map,
				"Set":Set,
			}[name]??classNames.get(name);
			if(!classObj)throw Error("class '" + name + "' not found in class list");
			let object;
			switch(classObj){
				case Array:
					object = [];
				break;
				case Set:
					object = new Set();
				break;
				case Map:
					object = new Map();
				break;
				default:
					object = {};
					properties.forEach(([key,value])=>refs[i][refs[key]] = refs[value]);
					object = new classObj(object);//dummy object
			}
			reference[2] = classObj;
			reference[3] = object;
		}
	}
	populateObjects:
	for(let i = 0; i < refs.length; i++){
		let reference = refs[i];
		if(reference instanceof Array){
			let name = reference[0];//:String
			let properties = reference[1];//:[key:number,value:number][] | [value:number][]
			let classObj = reference[2];
			let object = reference[3];
			switch(classObj){
				case Array:
					properties.forEach(value=>object.push(refs[value]));
				break;
				case Set:
					properties.forEach(value=>object.add(refs[value]));
				break;
				case Map:
					properties.forEach(([key,value])=>object.set(refs[key], refs[value]));
				break;
				default:
					properties.forEach(([key,value])=>object[refs[key]] = refs[value] instanceof Array? refs[value][3]: refs[value]);
			}
		}
	}
	//refs[i] = Object.assign(new classList[i](),reference[1]);
	return refs[0][3];
}
let a = {a:5};
class asd{};
let b = {a,c:new asd};
a.b = b;
//console.log(deReference(a).cloned);
//console.log(parseList(deReference(a).cloned,[[class asd{},"asd"]]));
if(1)module.exports={
	listify:deReference,
	parseList:parseList,
};