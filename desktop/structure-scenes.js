/* Pure DOM/SVG view: node IDs are independent of values and array positions. */
export function renderStructure(scene) {
  const ns='http://www.w3.org/2000/svg';
  const make=(tag,attrs={},text)=>{const e=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))e.setAttribute(key,value);if(text!==undefined)e.textContent=text;return e;};
  const svg=make('svg',{class:'structure-diagram',role:'img','aria-label':scene.type==='graph'?'图的节点与连线':'树的节点与连线'});
  const nodes=new Map(scene.nodes.map(node=>[node.id,node])),positions=new Map();
  let height=200;
  if(scene.type==='tree'){
    let ordinal=0,maxDepth=0;
    const walk=(id,depth)=>{if(id===null||!nodes.has(id))return;const node=nodes.get(id);walk(node.left,depth+1);positions.set(id,{ordinal:ordinal++,depth});maxDepth=Math.max(maxDepth,depth);walk(node.right,depth+1);};
    walk(scene.root,0);height=Math.max(140,(maxDepth+1)*62+32);
    for(const point of positions.values()){point.x=30+(point.ordinal+.5)*400/Math.max(1,ordinal);point.y=30+point.depth*62;}
  }else{
    const n=nodes.size;scene.nodes.forEach((node,i)=>{const angle=-Math.PI/2+2*Math.PI*i/n;positions.set(node.id,{x:n===1?230:230+155*Math.cos(angle),y:n===1?100:100+70*Math.sin(angle)});});
  }
  svg.setAttribute('viewBox',`0 0 460 ${height}`);
  if(!nodes.size){svg.append(make('text',{x:230,y:55,'text-anchor':'middle'},'（空堆）'));return svg;}
  const defs=make('defs'),marker=make('marker',{id:'structure-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto'});
  marker.append(make('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#858585'}));defs.append(marker);svg.append(defs);
  const edges=scene.type==='graph'?scene.edges:scene.nodes.flatMap(node=>[node.left,node.right].filter(id=>id!==null).map(id=>[node.id,id]));
  for(const [from,to] of edges){const a=positions.get(from),b=positions.get(to);if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
    svg.append(make('line',{x1:a.x+dx*23/d,y1:a.y+dy*23/d,x2:b.x-dx*26/d,y2:b.y-dy*26/d,class:'structure-edge',...(scene.directed?{'marker-end':'url(#structure-arrow)'}:{})}));}
  for(const node of scene.nodes){const p=positions.get(node.id);if(!p)continue;const active=scene.active?.includes(node.id),seen=scene.seen?.[node.id]===true;
    const group=make('g',{class:`structure-node${active?' active':''}${seen?' seen':''}`,'data-node':node.id,transform:`translate(${p.x},${p.y})`});
    group.append(make('rect',{x:-24,y:-19,width:48,height:38,rx:5}),make('text',{x:0,y:-6,'text-anchor':'middle',class:'node-id'},`#${node.id+1}`),make('text',{x:0,y:10,'text-anchor':'middle'},`${node.value}${node.count>1?' ×'+node.count:''}`));
    if(scene.avl){const h=id=>id===null?0:nodes.get(id)?.height??0;group.append(make('text',{x:0,y:31,'text-anchor':'middle',class:'node-id'},`h=${node.height} bf=${h(node.left)-h(node.right)}`));}
    svg.append(group);
  }
  return svg;
}
