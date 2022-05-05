// effect(()=>{
//     state.name
//     effect2(()=>{
//         state.age
//     })
//     state.address
// })

function cleanUpEffcet(effect){
    const { deps } = effect;
    for(let dep of deps){
        dep.delete(effect);//让属性对应的effect移除掉，这样属性更新的时候 就不会触发这个effect重新执行了。
    }
}



let effectStack = [];//目的是为了能保证我们的effect执行的时候 可以存贮正确的关系
let activeEffect; 
export class ReactiveEffect{//让effect记录他依赖了哪些属性 同时还要记录属性依赖了哪些方法
    active = true;//让effect 记录了哪些属性 同事记录了当前属性依赖了那个effect
    deps = [];//
    constructor(public fn, public scheduler?){//public作用 this.fn = fn

    }
    
    run(){
       
        if(!this.active){
            return this.fn();
        }
        if(!effectStack.includes(this)){//屏蔽同一个effect会多次执行
            try{
                effectStack.push(activeEffect = this);
                return this.fn();//取值 new Proxy 会执行get方法 依赖收集 
            }catch(e){
    
            }finally{
                effectStack.pop();
                activeEffect = effectStack[effectStack.length-1]
            }
            
            
        }
    }

    stop(){//让effect和dep 取消关联 dep上面存储的effect移除掉即可
        if (this.active ){
            cleanUpEffcet(this)
            this.active = false;
        }
    }
}


//对象:属性 ：【effect，effect】
export function isTracking(){
    return activeEffect !== undefined
}
const targetMap = new WeakMap();

export function track(target,key){//收集数据变化 1个属性对应多个effect 一个effect中依赖多个属性 多对多
    //是只要取值就要收集吗？
    if(!isTracking()){//不依赖于effect属性 直接跳出
        return 
    }
    let depsMap = targetMap.get(target);
    if(!depsMap){
        targetMap.set(target,(depsMap = new Map()));//{obj:map{}}
    }
    let dep = depsMap.get(key);
    if(!dep){
        depsMap.set(key, (dep = new Set()))//{对象：map｛name：set【】｝}
    }
    trackEffects(dep);
}

export function trackEffects(dep){
    let shouldTrack = !dep.has(activeEffect);//看一下这个属性有没有存过effcet
    if(shouldTrack){
        dep.add(activeEffect)// {obj:map{name:set[effect,effect]}}
        activeEffect.deps.push(dep);//稍后用到 
    }//{对象：｛name：set，age：set｝}
}

export function trigger(target,key){
    let depsMap = targetMap.get(target)

    if(!depsMap) return //说明修改的属性根本没有依赖任何的effect

    let deps = [];//set,set[]
    if(key !== undefined){
        deps.push(depsMap.get(key))
    }
    let effects = [];
    for(const dep of deps){
        effects.push(...dep)
    }
    triggerEffects(effects)
}

export function triggerEffects(dep){
    for(const effect of dep){//如果当前effect执行和要执行的effect是同一个 不要执行防止死循环
        if(effect !== activeEffect){
            if(effect.scheduler){
                return effect.scheduler();
            }
            effect.run();//执行effect
        }

    }
}

export function effect (fn){
  const _effect =   new ReactiveEffect(fn);
  _effect.run();//默认要fn执行一次

  let runner =  _effect.run.bind(_effect);
  return runner //返回runner。可以控制effect再次执行
}