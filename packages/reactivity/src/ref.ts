import { isTracking, trackEffects, triggerEffects } from "./effect";
import { toReactive } from "./reactive";

class RefImpl{
    public dep;
    public __v_isRef;
    public _value;
    constructor(public _rawValue){
        //rawValue如果用户传过来的是对象 我需要将对象转为响应式
        this._value = toReactive(_rawValue);
    }

    get value(){
        if(isTracking()){
            trackEffects(this.dep || (this.dep = new Set()))
        }

        return this._value
    }

    set value(newValue){
        if(newValue !== this._rawValue){
            this._rawValue = newValue;
            this._value = toReactive(newValue);
            triggerEffects(this.dep);
        }
    }
}

function createRef(value){
    return new RefImpl(value)
}


export function ref(value) {
    return createRef(value)
}


//reactive readonly