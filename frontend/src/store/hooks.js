import { useDispatch, useSelector } from 'react-redux';

/**
 * Typed hook for useDispatch
 * Use throughout the app instead of plain `useDispatch`
 */
export const useAppDispatch = () => useDispatch();

/**
 * Typed hook for useSelector
 * Use throughout the app instead of plain `useSelector`
 */
export const useAppSelector = useSelector;
