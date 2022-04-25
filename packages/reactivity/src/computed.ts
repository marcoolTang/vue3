import { isFunction } from "@vue/shared"
import { ReactiveEffect } from "./effect";
class ComputedRefImpl {
    public dep;//this.dep = undefined
    public _dirty = true;//this.dirty = true;
    public __v_isRef = true;
    public effect;
    public _value;
    constructor(getter,public setter){
        //将计算属性包成一个effect
        this.effect = new ReactiveEffect(getter);
    }

    get value(){
        this._value = this.effect.run();
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