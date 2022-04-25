import { isObject } from "@vue/shared";
import { track } from "./effect";
import { trigger } from './effect';
const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}
const mutableHandler : ProxyHandler<Record<any, any>> = {
    get(target, key, recevier){//receiver 指的是代理对象本身 就是 const proxy
        if(key === ReactiveFlags.IS_REACTIVE ){
            return true
        }
        track(target,key)
        
        //这里取值了，可以收集他在哪个effect中
        const res = Reflect.get(target,key,recevier);//=target[key]
        return res

    },
    set(target, key, value, recevier){

        let oldValue = ( target as any) [key];

        //如果改值了，可以在这里出发effect 更新

        //找属性对应的effect 让他执行
        const res = Reflect.set(target,key,value,recevier)//==target[key] = value
        
        if(oldValue !== value){
            trigger(target,key)
        }
        return res;
    }
}

//map何weakMap 的区别
const reactiveMap = new WeakMap();//弱引用 key必须是对象 如果key没有用被引用可以被自动销毁


function createReactiveObject (target:object){
    //先默认认为这个target已经是代理过的属性了
    //这个target取值了。就会走handler的get 一个代理对象被代理 又再次代理这个对象
    if((target as any)[ReactiveFlags.IS_REACTIVE]){
        return target
    }

    //reactive 只针对对象
    if(!isObject(target)){
        return target
    }
    const exisitingProxy = reactiveMap.get(target)
    if(exisitingProxy){//如果有缓存 直接使用上次的代理结果 这是同一个对象被代理两次
        return exisitingProxy
    }
    const proxy = new Proxy(target,mutableHandler); //当用户获取属性或者更改属性我能劫持到
    reactiveMap.set(target,proxy);//将源对象和代理对象做个映射表

    return proxy
}


export function reactive ( target: object){
    return createReactiveObject(target)
    
}

// export function readOnly ( target: object){
    
    
// }

// export function shallowReadOnly ( target: object){
    
    
// }


// export function shallowReactive ( target: object){
    
    
// }