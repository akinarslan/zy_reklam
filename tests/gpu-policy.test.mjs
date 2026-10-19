import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isHardwareTiming,diagnosticExit} from './helpers/gpu-policy.mjs';
const timeout={name:'TimeoutError',message:'Timeout 30000ms exceeded.'};
const healthy={width:3840,state:'ready',canvasCount:1,webgl:true,contextLost:false,overflow:false,identity:true,matrixRunning:true,matrixCanvas:1,errors:[]};
test('GPU policy only downgrades identified timing in a healthy large WebGL scene',()=>{
 for(const phase of ['hero-idle','png-readback'])assert.equal(isHardwareTiming(timeout,healthy,phase),true);
 assert.equal(isHardwareTiming(timeout,{...healthy,width:1440},'hero-idle'),false);
 assert.equal(isHardwareTiming(timeout,healthy,'navigation'),false);
 assert.equal(isHardwareTiming({name:'AssertionError'},healthy,'hero-idle'),false);
 assert.equal(isHardwareTiming(new Error('unknown failure'),healthy,'png-readback'),false);
});
test('GPU policy never downgrades crash, pageerror, context loss, missing WebGL, replaced canvas or UI corruption',()=>{
 for(const changes of [{errors:['page crash']},{errors:['pageerror']},{contextLost:true},{webgl:false},{canvasCount:0},{canvasCount:2},{state:'fallback'},{identity:false},{matrixRunning:false},{matrixCanvas:0},{matrixCanvas:2},{overflow:true}])assert.equal(isHardwareTiming(timeout,{...healthy,...changes},'hero-idle'),false,JSON.stringify(changes));
});
test('GPU policy preserves failed assertions as warnings only when every failure is classified hardware timing',()=>{
 assert.equal(diagnosticExit(1,[{passed:false,category:'hardware-timing'}],1),0);
 assert.equal(diagnosticExit(1,[{passed:false,category:'critical'}],1),1);
 assert.equal(diagnosticExit(1,[{passed:false,category:'hardware-timing'},{passed:false,category:'critical'}],2),1);
 assert.equal(diagnosticExit(1,[{passed:false,category:'hardware-timing'}],2),1,'unrecorded hook/runner failures must fail');
 assert.equal(diagnosticExit(2,[{passed:false,category:'hardware-timing'}],1),1,'aborted runner must fail');
 assert.equal(diagnosticExit(0,[],0),1,'empty evidence must fail');
 assert.equal(diagnosticExit(0,[{passed:true,category:'pass'}],0),0);
});
