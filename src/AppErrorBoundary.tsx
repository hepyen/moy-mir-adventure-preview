import React from 'react';

type BoundaryState={error:Error|null};
/** React render failures must never leave a child staring at a blank white screen. */
export class AppErrorBoundary extends React.Component<{children:React.ReactNode},BoundaryState>{
 state:BoundaryState={error:null};
 static getDerivedStateFromError(error:Error):BoundaryState{return {error}}
 componentDidCatch(error:Error,info:React.ErrorInfo){
  console.error('My World screen failed; user data was not reset',error,info.componentStack);
 }
 render(){
  if(!this.state.error)return this.props.children;
  return <main role="alert" style={{minHeight:'100dvh',display:'grid',placeItems:'center',padding:20,background:'#101d28',color:'#f4f4ef',fontFamily:'system-ui, sans-serif'}}>
   <section style={{maxWidth:480,width:'100%',padding:26,border:'1px solid #49626e',borderRadius:18,background:'#21313e'}}>
    <h1 style={{fontSize:24,margin:'0 0 12px'}}>Мой мир: ошибка экрана</h1>
    <p>Приложение столкнулось с ошибкой при открытии раздела. Твои баллы и сохранённые данные не удалялись.</p>
    <p>Попробуй перезапустить экран. Если ошибка повторится, сообщи родителю.</p>
    <button type="button" onClick={()=>window.location.reload()} style={{padding:'12px 18px',background:'#b0e3bb',color:'#142c1b',border:0,borderRadius:10,fontWeight:700}}>Перезапустить приложение</button>
    <details style={{marginTop:18,fontSize:12,overflowWrap:'anywhere'}}><summary>Технические подробности</summary><pre style={{whiteSpace:'pre-wrap'}}>{this.state.error.message}</pre></details>
   </section>
  </main>;
 }
}
