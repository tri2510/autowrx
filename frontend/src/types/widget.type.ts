// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

export type InterceptorType = (
  api: string,
  method: 'get' | 'set' | 'subscribe',
) => ((args: any[], prevReturnValue: any) => Promise<any | true>) | null

type WidgetDeactivateFunction = () => void

type PopupDeactivateFunction = () => void

interface BoxType {
  window: Window | null
  injectNode: (node: Node) => void
  injectHTML: (html: string) => void
  triggerPopup: (
    node: Node,
    className?: string,
  ) => undefined | PopupDeactivateFunction
  options?: any
}

type WidgetActivateFunction = (
  box: BoxType,
) => undefined | WidgetDeactivateFunction

export type WidgetType = {
  plugin_name: string
  name: string
  boxes: number
  direction: 'horizontal' | 'vertical'
  onActivate: WidgetActivateFunction
  options?: any
}

export interface GridItem {
  plugin: string
  widget: string
  boxes: number[]
  options?: any
}

export interface PluginPropWidgets {
  register: (name: string, onActivate: WidgetActivateFunction) => undefined
}

export interface WidgetConfig {
  plugin: string
  widget: string
  url: string
  options: any
  boxes: number[]
  path?: string
}
