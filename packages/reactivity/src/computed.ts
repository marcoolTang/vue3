import { isFunction } from "@vue/shared"
import { isTracking, ReactiveEffect, trackEffects, triggerEffects } from "./effect";
class ComputedRefImpl {
    public dep;//this.dep = undefined
    public _dirty = true;//this.dirty = true;
    public __v_isRef = true;
    public effect;
    public _value;
    constructor(getter,public setter){
        //将计算属性包成一个effect

        //这里 我给计算属性变成了effect 那么计算属性的属性会收集这个effect
        this.effect = new ReactiveEffect(getter,()=>{
            //稍后计算属性依赖值的变化 不要重新执行计算属性的effect 还是调用此函数
            if(!this._dirty){
                this._dirty = true;
                debugger
                triggerEffects(this.dep)
            }
        });
    }

    get value(){

        if(!isTracking()){//是否是在effect中取值的
            trackEffects(this.dep || (this.dep = new Set))
        }


        if(this._dirty) {
            //将计算结果缓存到this._value 这样不用每次都run
            this._value = this.effect.run();
            this._dirty = false;
        }
        
        return this._value;
    }

    set value(newValue){
        this.setter(newValue);
    }
}
export function computed(getterOptions){
    const onlyGetter = isFunction(getterOptions);
    let getter;
    let setter;
    if(onlyGetter){
        getter = getterOptions;
        setter = ()=>{}
    }else{
        getter = getterOptions.get;
        setter = getterOptions.set;
    }

    return new ComputedRefImpl(getter,setter)
   
}