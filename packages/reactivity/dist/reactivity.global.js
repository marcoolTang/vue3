var VueReactivity = (function (exports) {
  'use strict';

  // effect(()=>{
  //     state.name
  //     effect2(()=>{
  //         state.age
  //     })
  //     state.address
  // })
  function cleanUpEffcet(effect) {
      const { deps } = effect;
      for (let dep of deps) {
          dep.delete(effect); //让属性对应的effect移除掉，这样属性更新的时候 就不会触发这个effect重新执行了。
      }
  }
  let effectStack = []; //目的是为了能保证我们的effect执行的时候 可以存贮正确的关系
  let activeEffect;
  class ReactiveEffect {
      constructor(fn) {
          this.fn = fn;
          this.active = true; //让effect 记录了哪些属性 同事记录了当前属性依赖了那个effect
          this.deps = []; //
      }
      run() {
          if (!this.active) {
              return this.fn();
          }
          if (!effectStack.includes(this)) { //屏蔽同一个effect会多次执行
              try {
                  effectStack.push(activeEffect = this);
                  return this.fn(); //取值 new Proxy 会执行get方法 依赖收集 
              }
              catch (e) {
              }
              finally {
                  effectStack.pop();
                  activeEffect = effectStack[effectStack.length - 1];
              }
          }
      }
      stop() {
          if (this.active) {
              cleanUpEffcet(this);
              this.active = false;
          }
      }
  }
  //对象:属性 ：【effect，effect】
  function isTracking() {
      return activeEffect !== undefined;
  }
  const targetMap = new WeakMap();
  function track(target, key) {
      //是只要取值就要收集吗？
      if (!isTracking()) { //不依赖于effect属性 直接跳出
          return;
      }
      let depsMap = targetMap.get(target);
      if (!depsMap) {
          targetMap.set(target, (depsMap = new Map())); //{obj:map{}}
      }
      let dep = depsMap.get(key);
      if (!dep) {
          depsMap.set(key, (dep = new Set())); //{对象：map｛name：set【】｝}
      }
      let shouldTrack = !dep.has(activeEffect); //看一下这个属性有没有存过effcet
      if (shouldTrack) {
          dep.add(activeEffect); // {obj:map{name:set[effect,effect]}}
          activeEffect.deps.push(dep); //稍后用到 
      }
  }
  function trigger(target, key) {
      let depsMap = targetMap.get(target);
      if (!depsMap)
          return; //说明修改的属性根本没有依赖任何的effect
      let deps = []; //set,set[]
      if (key !== undefined) {
          deps.push(depsMap.get(key));
      }
      let effects = [];
      for (const dep of deps) {
          effects.push(...dep);
      }
      for (const effect of effects) { //如果当前effect执行和要执行的effect是同一个 不要执行防止死循环
          if (effect !== activeEffect) {
              effect.run(); //执行effect
          }
      }
  }
  function effect(fn) {
      const _effect = new ReactiveEffect(fn);
      _effect.run(); //默认要fn执行一次
      let runner = _effect.run.bind(_effect);
      return runner; //返回runner。可以控制effect再次执行
  }

  function isObject(value) {
      return typeof value === 'object' && value !== null;
  }
  function isFunction(value) {
      return typeof value === 'function';
  }

  const mutableHandler = {
      get(target, key, recevier) {
          if (key === "__v_isReactive" /* IS_REACTIVE */) {
              return true;
          }
          track(target, key);
          //这里取值了，可以收集他在哪个effect中
          const res = Reflect.get(target, key, recevier); //=target[key]
          return res;
      },
      set(target, key, value, recevier) {
          let oldValue = target[key];
          //如果改值了，可以在这里出发effect 更新
          //找属性对应的effect 让他执行
          const res = Reflect.set(target, key, value, recevier); //==target[key] = value
          if (oldValue !== value) {
              trigger(target, key);
          }
          return res;
      }
  };
  //map何weakMap 的区别
  const reactiveMap = new WeakMap(); //弱引用 key必须是对象 如果key没有用被引用可以被自动销毁
  function createReactiveObject(target) {
      //先默认认为这个target已经是代理过的属性了
      //这个target取值了。就会走handler的get 一个代理对象被代理 又再次代理这个对象
      if (target["__v_isReactive" /* IS_REACTIVE */]) {
          return target;
      }
      //reactive 只针对对象
      if (!isObject(target)) {
          return target;
      }
      const exisitingProxy = reactiveMap.get(target);
      if (exisitingProxy) { //如果有缓存 直接使用上次的代理结果 这是同一个对象被代理两次
          return exisitingProxy;
      }
      const proxy = new Proxy(target, mutableHandler); //当用户获取属性或者更改属性我能劫持到
      reactiveMap.set(target, proxy); //将源对象和代理对象做个映射表
      return proxy;
  }
  function reactive(target) {
      return createReactiveObject(target);
  }
  // export function readOnly ( target: object){
  // }
  // export function shallowReadOnly ( target: object){
  // }
  // export function shallowReactive ( target: object){
  // }

  class ComputedRefImpl {
      constructor(getter, setter) {
          this.setter = setter;
          this._dirty = true; //this.dirty = true;
          this.__v_isRef = true;
          //将计算属性包成一个effect
          this.effect = new ReactiveEffect(getter);
      }
      get value() {
          this._value = this.effect.run();
          return this._value;
      }
      set value(newValue) {
          this.setter(newValue);
      }
  }
  function computed(getterOptions) {
      const onlyGetter = isFunction(getterOptions);
      let getter;
      let setter;
      if (onlyGetter) {
          getter = getterOptions;
          setter = () => { };
      }
      else {
          getter = getterOptions.get;
          setter = getterOptions.set;
      }
      return new ComputedRefImpl(getter, setter);
  }

  exports.computed = computed;
  exports.effect = effect;
  exports.reactive = reactive;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
