package com.yuwjoo.myhomecontroller.assists

import com.ven.assists.stepper.Step
import com.ven.assists.stepper.StepCollector
import com.ven.assists.stepper.StepImpl

class MyStepImpl: StepImpl() {
    override fun onImpl(collector: StepCollector) {
        //定义步骤序号为1的逻辑
        collector.next(1) {// 1为步骤的序号
            //步骤1逻辑
            //返回下一步需要执行的序号，通过Step.get([序号])，如果需要重复该步骤可返回Step.repeat，如果返回Step.none则不执行任何步骤，相当于停止
            return@next Step.get(2, delay = 1000) //将会执行步骤2逻辑
        }.next(2) {
            //步骤2逻辑
            //返回下一步需要执行的序号，通过Step.get([序号])
            return@next Step.get(3)
        }.next(3) {
            //步骤3逻辑
            //返回下一步需要执行的序号，通过Step.get([序号])
            return@next Step.get(4)
        }
    }
}
