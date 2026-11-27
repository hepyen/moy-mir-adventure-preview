import {useEffect} from 'react'
import {useThree} from '@react-three/fiber'
// Stop animation when the app is hidden. No network or location work here.
export function CanvasLifecycle(){const {setFrameloop,invalidate}=useThree();useEffect(()=>{const change=()=>{const visible=document.visibilityState!=='hidden';setFrameloop(visible?'always':'never');if(visible)invalidate()};change();document.addEventListener('visibilitychange',change);return()=>{document.removeEventListener('visibilitychange',change)}},[setFrameloop,invalidate]);return null}
