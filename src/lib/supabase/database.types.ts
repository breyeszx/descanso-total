
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "_migrations": {
                  Row: {
                    "applied_at": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "applied_at"?: string,"name": string
                  }
                  Update: {
                    "applied_at"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"acompanantes": {
                  Row: {
                    "created_at": string,"documento": string,"fecha_nacimiento": string | null,"id": number,"nombre": string,"reserva_id": number,"telefono": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"documento": string,"fecha_nacimiento"?: string | null,"id"?: never,"nombre": string,"reserva_id": number,"telefono"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"documento"?: string,"fecha_nacimiento"?: string | null,"id"?: never,"nombre"?: string,"reserva_id"?: number,"telefono"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "acompanantes_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    }
                  ]
                },"actas": {
                  Row: {
                    "checklist": NonNullable<Json>,"created_at": string,"fecha": string,"firma_conformidad": boolean,"firma_path": string | null,"funcionario_id": string,"id": number,"monto_cobrado": number,"observaciones": string | null,"pdf_path": string | null,"reserva_id": number,"tipo": Database["public"]['Enums']["tipo_acta"]
                  }
                  ComputedFields: never
                  Insert: {
                    "checklist"?: NonNullable<Json>,"created_at"?: string,"fecha"?: string,"firma_conformidad"?: boolean,"firma_path"?: string | null,"funcionario_id": string,"id"?: never,"monto_cobrado"?: number,"observaciones"?: string | null,"pdf_path"?: string | null,"reserva_id": number,"tipo": Database["public"]['Enums']["tipo_acta"]
                  }
                  Update: {
                    "checklist"?: NonNullable<Json>,"created_at"?: string,"fecha"?: string,"firma_conformidad"?: boolean,"firma_path"?: string | null,"funcionario_id"?: string,"id"?: never,"monto_cobrado"?: number,"observaciones"?: string | null,"pdf_path"?: string | null,"reserva_id"?: number,"tipo"?: Database["public"]['Enums']["tipo_acta"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "actas_funcionario_id_fkey"
      columns: ["funcionario_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "actas_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    }
                  ]
                },"auditoria": {
                  Row: {
                    "accion": string,"created_at": string,"datos_antes": Json | null,"datos_despues": Json | null,"id": number,"registro_id": string,"tabla": string,"usuario_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "accion": string,"created_at"?: string,"datos_antes"?: Json | null,"datos_despues"?: Json | null,"id"?: never,"registro_id": string,"tabla": string,"usuario_id"?: string | null
                  }
                  Update: {
                    "accion"?: string,"created_at"?: string,"datos_antes"?: Json | null,"datos_despues"?: Json | null,"id"?: never,"registro_id"?: string,"tabla"?: string,"usuario_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"clientes": {
                  Row: {
                    "apellido": string | null,"created_at": string,"direccion": string | null,"email": string,"id": number,"nombre": string,"notas": string | null,"pais": string | null,"profile_id": string | null,"rut": string | null,"telefono": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "apellido"?: string | null,"created_at"?: string,"direccion"?: string | null,"email": string,"id"?: never,"nombre": string,"notas"?: string | null,"pais"?: string | null,"profile_id"?: string | null,"rut"?: string | null,"telefono"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "apellido"?: string | null,"created_at"?: string,"direccion"?: string | null,"email"?: string,"id"?: never,"nombre"?: string,"notas"?: string | null,"pais"?: string | null,"profile_id"?: string | null,"rut"?: string | null,"telefono"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "clientes_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"conductores": {
                  Row: {
                    "activo": boolean,"id": number,"licencia": string | null,"nombre": string,"telefono": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"id"?: never,"licencia"?: string | null,"nombre": string,"telefono"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"id"?: never,"licencia"?: string | null,"nombre"?: string,"telefono"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"configuracion": {
                  Row: {
                    "clave": string,"descripcion": string | null,"updated_at": string,"valor": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "clave": string,"descripcion"?: string | null,"updated_at"?: string,"valor": NonNullable<Json>
                  }
                  Update: {
                    "clave"?: string,"descripcion"?: string | null,"updated_at"?: string,"valor"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"departamento_fotos": {
                  Row: {
                    "created_at": string,"departamento_id": number,"es_portada": boolean,"id": number,"orden": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"departamento_id": number,"es_portada"?: boolean,"id"?: never,"orden"?: number,"storage_path": string
                  }
                  Update: {
                    "created_at"?: string,"departamento_id"?: number,"es_portada"?: boolean,"id"?: never,"orden"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "departamento_fotos_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "departamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "departamento_fotos_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "vw_departamentos"
      referencedColumns: ["id"]
    }
                  ]
                },"departamentos": {
                  Row: {
                    "activo": boolean,"amenidades": (string)[],"banos": number,"capacidad_max": number,"codigo": string,"created_at": string,"descripcion": string | null,"direccion": string,"dormitorios": number,"id": number,"nombre": string,"tarifa_base": number,"updated_at": string,"zona_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"amenidades"?: (string)[],"banos"?: number,"capacidad_max"?: number,"codigo": string,"created_at"?: string,"descripcion"?: string | null,"direccion": string,"dormitorios"?: number,"id"?: never,"nombre": string,"tarifa_base": number,"updated_at"?: string,"zona_id": number
                  }
                  Update: {
                    "activo"?: boolean,"amenidades"?: (string)[],"banos"?: number,"capacidad_max"?: number,"codigo"?: string,"created_at"?: string,"descripcion"?: string | null,"direccion"?: string,"dormitorios"?: number,"id"?: never,"nombre"?: string,"tarifa_base"?: number,"updated_at"?: string,"zona_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "departamentos_zona_id_fkey"
      columns: ["zona_id"]
isOneToOne: false
      referencedRelation: "zonas"
      referencedColumns: ["id"]
    }
                  ]
                },"inventario_items": {
                  Row: {
                    "cantidad": number,"categoria": string | null,"created_at": string,"departamento_id": number,"descripcion": string | null,"estado": Database["public"]['Enums']["estado_item"],"fecha_adquisicion": string | null,"id": number,"nombre": string,"updated_at": string,"valor_unitario": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad"?: number,"categoria"?: string | null,"created_at"?: string,"departamento_id": number,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_item"],"fecha_adquisicion"?: string | null,"id"?: never,"nombre": string,"updated_at"?: string,"valor_unitario"?: number
                  }
                  Update: {
                    "cantidad"?: number,"categoria"?: string | null,"created_at"?: string,"departamento_id"?: number,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_item"],"fecha_adquisicion"?: string | null,"id"?: never,"nombre"?: string,"updated_at"?: string,"valor_unitario"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventario_items_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "departamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_items_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "vw_departamentos"
      referencedColumns: ["id"]
    }
                  ]
                },"inventario_movimientos": {
                  Row: {
                    "cantidad": number,"costo": number,"created_at": string,"descripcion": string | null,"id": number,"item_id": number,"registrado_por": string | null,"reserva_id": number | null,"tipo": Database["public"]['Enums']["tipo_movimiento_inventario"]
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad"?: number,"costo"?: number,"created_at"?: string,"descripcion"?: string | null,"id"?: never,"item_id": number,"registrado_por"?: string | null,"reserva_id"?: number | null,"tipo": Database["public"]['Enums']["tipo_movimiento_inventario"]
                  }
                  Update: {
                    "cantidad"?: number,"costo"?: number,"created_at"?: string,"descripcion"?: string | null,"id"?: never,"item_id"?: number,"registrado_por"?: string | null,"reserva_id"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_movimiento_inventario"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "inventario_movimientos_item_id_fkey"
      columns: ["item_id"]
isOneToOne: false
      referencedRelation: "inventario_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_movimientos_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "inventario_movimientos_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    }
                  ]
                },"mantenciones": {
                  Row: {
                    "costo": number,"creado_por": string | null,"created_at": string,"departamento_id": number,"descripcion": string | null,"estado": Database["public"]['Enums']["estado_mantencion"],"fecha_fin": string,"fecha_inicio": string,"id": number,"responsable": string | null,"titulo": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "costo"?: number,"creado_por"?: string | null,"created_at"?: string,"departamento_id": number,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_mantencion"],"fecha_fin": string,"fecha_inicio": string,"id"?: never,"responsable"?: string | null,"titulo": string,"updated_at"?: string
                  }
                  Update: {
                    "costo"?: number,"creado_por"?: string | null,"created_at"?: string,"departamento_id"?: number,"descripcion"?: string | null,"estado"?: Database["public"]['Enums']["estado_mantencion"],"fecha_fin"?: string,"fecha_inicio"?: string,"id"?: never,"responsable"?: string | null,"titulo"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mantenciones_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mantenciones_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "departamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mantenciones_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "vw_departamentos"
      referencedColumns: ["id"]
    }
                  ]
                },"movimientos_financieros": {
                  Row: {
                    "categoria": Database["public"]['Enums']["categoria_movimiento"],"comprobante_path": string | null,"created_at": string,"departamento_id": number | null,"descripcion": string | null,"fecha": string,"id": number,"mantencion_id": number | null,"monto": number,"pago_id": number | null,"registrado_por": string | null,"reserva_id": number | null,"tipo": Database["public"]['Enums']["tipo_movimiento"]
                  }
                  ComputedFields: never
                  Insert: {
                    "categoria": Database["public"]['Enums']["categoria_movimiento"],"comprobante_path"?: string | null,"created_at"?: string,"departamento_id"?: number | null,"descripcion"?: string | null,"fecha"?: string,"id"?: never,"mantencion_id"?: number | null,"monto": number,"pago_id"?: number | null,"registrado_por"?: string | null,"reserva_id"?: number | null,"tipo": Database["public"]['Enums']["tipo_movimiento"]
                  }
                  Update: {
                    "categoria"?: Database["public"]['Enums']["categoria_movimiento"],"comprobante_path"?: string | null,"created_at"?: string,"departamento_id"?: number | null,"descripcion"?: string | null,"fecha"?: string,"id"?: never,"mantencion_id"?: number | null,"monto"?: number,"pago_id"?: number | null,"registrado_por"?: string | null,"reserva_id"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_movimiento"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "movimientos_financieros_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "departamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_financieros_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "vw_departamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_financieros_mantencion_id_fkey"
      columns: ["mantencion_id"]
isOneToOne: false
      referencedRelation: "mantenciones"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_financieros_pago_id_fkey"
      columns: ["pago_id"]
isOneToOne: true
      referencedRelation: "pagos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_financieros_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "movimientos_financieros_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    }
                  ]
                },"notificaciones": {
                  Row: {
                    "asunto": string,"created_at": string,"destinatario": string,"enviada_at": string | null,"error": string | null,"estado": Database["public"]['Enums']["estado_notificacion"],"id": number,"payload": NonNullable<Json>,"programada_para": string,"proveedor_id": string | null,"reserva_id": number | null,"tipo": Database["public"]['Enums']["tipo_notificacion"]
                  }
                  ComputedFields: never
                  Insert: {
                    "asunto": string,"created_at"?: string,"destinatario": string,"enviada_at"?: string | null,"error"?: string | null,"estado"?: Database["public"]['Enums']["estado_notificacion"],"id"?: never,"payload"?: NonNullable<Json>,"programada_para"?: string,"proveedor_id"?: string | null,"reserva_id"?: number | null,"tipo": Database["public"]['Enums']["tipo_notificacion"]
                  }
                  Update: {
                    "asunto"?: string,"created_at"?: string,"destinatario"?: string,"enviada_at"?: string | null,"error"?: string | null,"estado"?: Database["public"]['Enums']["estado_notificacion"],"id"?: never,"payload"?: NonNullable<Json>,"programada_para"?: string,"proveedor_id"?: string | null,"reserva_id"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_notificacion"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "notificaciones_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    }
                  ]
                },"pagos": {
                  Row: {
                    "concepto": Database["public"]['Enums']["concepto_pago"],"created_at": string,"estado": Database["public"]['Enums']["estado_pago"],"id": number,"medio": Database["public"]['Enums']["medio_pago"],"monto": number,"notas": string | null,"pagado_at": string | null,"registrado_por": string | null,"reserva_id": number,"updated_at": string,"webpay_authorization_code": string | null,"webpay_buy_order": string | null,"webpay_response": Json | null,"webpay_token": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "concepto": Database["public"]['Enums']["concepto_pago"],"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_pago"],"id"?: never,"medio": Database["public"]['Enums']["medio_pago"],"monto": number,"notas"?: string | null,"pagado_at"?: string | null,"registrado_por"?: string | null,"reserva_id": number,"updated_at"?: string,"webpay_authorization_code"?: string | null,"webpay_buy_order"?: string | null,"webpay_response"?: Json | null,"webpay_token"?: string | null
                  }
                  Update: {
                    "concepto"?: Database["public"]['Enums']["concepto_pago"],"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_pago"],"id"?: never,"medio"?: Database["public"]['Enums']["medio_pago"],"monto"?: number,"notas"?: string | null,"pagado_at"?: string | null,"registrado_por"?: string | null,"reserva_id"?: number,"updated_at"?: string,"webpay_authorization_code"?: string | null,"webpay_buy_order"?: string | null,"webpay_response"?: Json | null,"webpay_token"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pagos_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pagos_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"email": string,"id": string,"nombre": string,"rol": Database["public"]['Enums']["rol_usuario"],"telefono": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"id": string,"nombre": string,"rol"?: Database["public"]['Enums']["rol_usuario"],"telefono"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"id"?: string,"nombre"?: string,"rol"?: Database["public"]['Enums']["rol_usuario"],"telefono"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reserva_cargos": {
                  Row: {
                    "acta_id": number | null,"created_at": string,"descripcion": string,"id": number,"inventario_item_id": number | null,"monto": number,"registrado_por": string | null,"reserva_id": number,"tipo": Database["public"]['Enums']["tipo_cargo"]
                  }
                  ComputedFields: never
                  Insert: {
                    "acta_id"?: number | null,"created_at"?: string,"descripcion": string,"id"?: never,"inventario_item_id"?: number | null,"monto": number,"registrado_por"?: string | null,"reserva_id": number,"tipo": Database["public"]['Enums']["tipo_cargo"]
                  }
                  Update: {
                    "acta_id"?: number | null,"created_at"?: string,"descripcion"?: string,"id"?: never,"inventario_item_id"?: number | null,"monto"?: number,"registrado_por"?: string | null,"reserva_id"?: number,"tipo"?: Database["public"]['Enums']["tipo_cargo"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "reserva_cargos_acta_id_fkey"
      columns: ["acta_id"]
isOneToOne: false
      referencedRelation: "actas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reserva_cargos_inventario_item_id_fkey"
      columns: ["inventario_item_id"]
isOneToOne: false
      referencedRelation: "inventario_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reserva_cargos_registrado_por_fkey"
      columns: ["registrado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reserva_cargos_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    }
                  ]
                },"reserva_servicios": {
                  Row: {
                    "cantidad": number,"created_at": string,"estado": Database["public"]['Enums']["estado_reserva_servicio"],"fecha_programada": string | null,"id": number,"notas": string | null,"precio_unitario": number,"reserva_id": number,"servicio_id": number,"subtotal": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cantidad"?: number,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_reserva_servicio"],"fecha_programada"?: string | null,"id"?: never,"notas"?: string | null,"precio_unitario": number,"reserva_id": number,"servicio_id": number,"subtotal"?: never
                  }
                  Update: {
                    "cantidad"?: number,"created_at"?: string,"estado"?: Database["public"]['Enums']["estado_reserva_servicio"],"fecha_programada"?: string | null,"id"?: never,"notas"?: string | null,"precio_unitario"?: number,"reserva_id"?: number,"servicio_id"?: number,"subtotal"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "reserva_servicios_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reserva_servicios_servicio_id_fkey"
      columns: ["servicio_id"]
isOneToOne: false
      referencedRelation: "servicios"
      referencedColumns: ["id"]
    }
                  ]
                },"reservas": {
                  Row: {
                    "cancelada_at": string | null,"cliente_id": number,"codigo": string,"creado_por": string | null,"created_at": string,"departamento_id": number,"estado": Database["public"]['Enums']["estado_reserva"],"fecha_fin": string,"fecha_inicio": string,"id": number,"monto_anticipo": number,"monto_arriendo": number,"monto_cargos": number,"monto_pagado": number,"monto_servicios": number,"monto_total": number,"motivo_cancelacion": string | null,"noches": number | null,"notas": string | null,"num_huespedes": number,"origen": Database["public"]['Enums']["origen_reserva"],"saldo_pendiente": number | null,"tarifa_noche_aplicada": number | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cancelada_at"?: string | null,"cliente_id": number,"codigo": string,"creado_por"?: string | null,"created_at"?: string,"departamento_id": number,"estado"?: Database["public"]['Enums']["estado_reserva"],"fecha_fin": string,"fecha_inicio": string,"id"?: never,"monto_anticipo"?: number,"monto_arriendo"?: number,"monto_cargos"?: number,"monto_pagado"?: number,"monto_servicios"?: number,"monto_total"?: number,"motivo_cancelacion"?: string | null,"noches"?: never,"notas"?: string | null,"num_huespedes"?: number,"origen"?: Database["public"]['Enums']["origen_reserva"],"saldo_pendiente"?: never,"tarifa_noche_aplicada"?: number | null,"updated_at"?: string
                  }
                  Update: {
                    "cancelada_at"?: string | null,"cliente_id"?: number,"codigo"?: string,"creado_por"?: string | null,"created_at"?: string,"departamento_id"?: number,"estado"?: Database["public"]['Enums']["estado_reserva"],"fecha_fin"?: string,"fecha_inicio"?: string,"id"?: never,"monto_anticipo"?: number,"monto_arriendo"?: number,"monto_cargos"?: number,"monto_pagado"?: number,"monto_servicios"?: number,"monto_total"?: number,"motivo_cancelacion"?: string | null,"noches"?: never,"notas"?: string | null,"num_huespedes"?: number,"origen"?: Database["public"]['Enums']["origen_reserva"],"saldo_pendiente"?: never,"tarifa_noche_aplicada"?: number | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "reservas_cliente_id_fkey"
      columns: ["cliente_id"]
isOneToOne: false
      referencedRelation: "clientes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservas_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservas_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "departamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reservas_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "vw_departamentos"
      referencedColumns: ["id"]
    }
                  ]
                },"servicios": {
                  Row: {
                    "activo": boolean,"created_at": string,"cupo_max": number | null,"descripcion": string | null,"duracion_horas": number | null,"id": number,"nombre": string,"precio": number,"requiere_transporte": boolean,"tipo": Database["public"]['Enums']["tipo_servicio"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"created_at"?: string,"cupo_max"?: number | null,"descripcion"?: string | null,"duracion_horas"?: number | null,"id"?: never,"nombre": string,"precio": number,"requiere_transporte"?: boolean,"tipo": Database["public"]['Enums']["tipo_servicio"],"updated_at"?: string
                  }
                  Update: {
                    "activo"?: boolean,"created_at"?: string,"cupo_max"?: number | null,"descripcion"?: string | null,"duracion_horas"?: number | null,"id"?: never,"nombre"?: string,"precio"?: number,"requiere_transporte"?: boolean,"tipo"?: Database["public"]['Enums']["tipo_servicio"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tarifas_temporada": {
                  Row: {
                    "departamento_id": number | null,"fecha_fin": string,"fecha_inicio": string,"id": number,"nombre": string,"tarifa_noche": number
                  }
                  ComputedFields: never
                  Insert: {
                    "departamento_id"?: number | null,"fecha_fin": string,"fecha_inicio": string,"id"?: never,"nombre": string,"tarifa_noche": number
                  }
                  Update: {
                    "departamento_id"?: number | null,"fecha_fin"?: string,"fecha_inicio"?: string,"id"?: never,"nombre"?: string,"tarifa_noche"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "tarifas_temporada_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "departamentos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tarifas_temporada_departamento_id_fkey"
      columns: ["departamento_id"]
isOneToOne: false
      referencedRelation: "vw_departamentos"
      referencedColumns: ["id"]
    }
                  ]
                },"transportes": {
                  Row: {
                    "conductor_id": number | null,"correo_enviado_at": string | null,"created_at": string,"destino": string | null,"estado": Database["public"]['Enums']["estado_transporte"],"fecha_hora": string,"id": number,"notas": string | null,"origen": string | null,"pasajeros": number,"reserva_id": number,"reserva_servicio_id": number | null,"tipo": Database["public"]['Enums']["tipo_transporte"],"updated_at": string,"vehiculo_id": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "conductor_id"?: number | null,"correo_enviado_at"?: string | null,"created_at"?: string,"destino"?: string | null,"estado"?: Database["public"]['Enums']["estado_transporte"],"fecha_hora": string,"id"?: never,"notas"?: string | null,"origen"?: string | null,"pasajeros"?: number,"reserva_id": number,"reserva_servicio_id"?: number | null,"tipo": Database["public"]['Enums']["tipo_transporte"],"updated_at"?: string,"vehiculo_id"?: number | null
                  }
                  Update: {
                    "conductor_id"?: number | null,"correo_enviado_at"?: string | null,"created_at"?: string,"destino"?: string | null,"estado"?: Database["public"]['Enums']["estado_transporte"],"fecha_hora"?: string,"id"?: never,"notas"?: string | null,"origen"?: string | null,"pasajeros"?: number,"reserva_id"?: number,"reserva_servicio_id"?: number | null,"tipo"?: Database["public"]['Enums']["tipo_transporte"],"updated_at"?: string,"vehiculo_id"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "transportes_conductor_id_fkey"
      columns: ["conductor_id"]
isOneToOne: false
      referencedRelation: "conductores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transportes_reserva_id_fkey"
      columns: ["reserva_id"]
isOneToOne: false
      referencedRelation: "reservas"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transportes_reserva_servicio_id_fkey"
      columns: ["reserva_servicio_id"]
isOneToOne: false
      referencedRelation: "reserva_servicios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "transportes_vehiculo_id_fkey"
      columns: ["vehiculo_id"]
isOneToOne: false
      referencedRelation: "vehiculos"
      referencedColumns: ["id"]
    }
                  ]
                },"vehiculos": {
                  Row: {
                    "activo": boolean,"capacidad": number,"id": number,"marca": string | null,"modelo": string | null,"patente": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activo"?: boolean,"capacidad"?: number,"id"?: never,"marca"?: string | null,"modelo"?: string | null,"patente": string
                  }
                  Update: {
                    "activo"?: boolean,"capacidad"?: number,"id"?: never,"marca"?: string | null,"modelo"?: string | null,"patente"?: string
                  }
                  Relationships: [
                    
                  ]
                },"zonas": {
                  Row: {
                    "activa": boolean,"descripcion": string | null,"id": number,"nombre": string,"region": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "activa"?: boolean,"descripcion"?: string | null,"id"?: never,"nombre": string,"region"?: string | null
                  }
                  Update: {
                    "activa"?: boolean,"descripcion"?: string | null,"id"?: never,"nombre"?: string,"region"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "vw_departamentos": {
                  Row: {
                    "activo": boolean | null,"amenidades": (string)[] | null,"banos": number | null,"capacidad_max": number | null,"codigo": string | null,"created_at": string | null,"descripcion": string | null,"direccion": string | null,"dormitorios": number | null,"estado_actual": Database["public"]['Enums']["estado_departamento"] | null,"foto_portada": string | null,"id": number | null,"nombre": string | null,"tarifa_base": number | null,"updated_at": string | null,"zona_id": number | null,"zona_nombre": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "departamentos_zona_id_fkey"
      columns: ["zona_id"]
isOneToOne: false
      referencedRelation: "zonas"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "calcular_arriendo":
{ Args: { "p_departamento": number,"p_fin": string,"p_inicio": string }; Returns: number
                           },
"cancelar_reserva":
{ Args: { "p_motivo"?: string,"p_reserva": number }; Returns: undefined
                           },
"cliente_actual_id":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"config_num":
{ Args: { "p_clave": string,"p_default"?: number }; Returns: number
                           },
"cotizar_reserva":
{ Args: { "p_departamento": number,"p_fin": string,"p_inicio": string }; Returns: {
              "disponible": boolean,"monto_anticipo": number,"monto_arriendo": number,"noches": number
            }[]
                           },
"crear_reserva":
{ Args: { "p_cliente"?: number,"p_departamento": number,"p_fin": string,"p_huespedes"?: number,"p_inicio": string,"p_notas"?: string,"p_servicios"?: Json }; Returns: number
                           },
"departamentos_disponibles":
{ Args: { "p_fin": string,"p_huespedes"?: number,"p_inicio": string,"p_zona"?: number }; Returns: {
              "activo": boolean,
"amenidades": (string)[],
"banos": number,
"capacidad_max": number,
"codigo": string,
"created_at": string,
"descripcion": string | null,
"direccion": string,
"dormitorios": number,
"id": number,
"nombre": string,
"tarifa_base": number,
"updated_at": string,
"zona_id": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "departamentos"
        isOneToOne: false
        isSetofReturn: true
      } },
"es_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"es_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"estado_departamento_actual":
{ Args: { "p_departamento": number,"p_fecha"?: string }; Returns: Database["public"]['Enums']["estado_departamento"]
                           },
"mantencion_solapa":
{ Args: { "p_departamento": number,"p_fin": string,"p_inicio": string }; Returns: boolean
                           },
"modificar_reserva":
{ Args: { "p_fin": string,"p_huespedes"?: number,"p_inicio": string,"p_reserva": number }; Returns: undefined
                           },
"recalcular_reserva":
{ Args: { "p_reserva": number }; Returns: undefined
                           },
"rol_actual":
{ Args: Record<PropertyKey, never>; Returns: Database["public"]['Enums']["rol_usuario"]
                           },
"tarifa_noche":
{ Args: { "p_departamento": number,"p_fecha": string }; Returns: number
                           }
          }
          Enums: {
            "categoria_movimiento": "arriendo"|"servicio_extra"|"cargo"|"reembolso"|"reparacion"|"mantencion"|"dividendo"|"contribucion"|"transporte"|"otro","concepto_pago": "anticipo"|"saldo"|"servicio_extra"|"cargo"|"reembolso","estado_departamento": "disponible"|"reservado"|"ocupado"|"en_mantencion"|"inactivo","estado_item": "bueno"|"deteriorado"|"en_reparacion"|"baja","estado_mantencion": "programada"|"en_curso"|"completada"|"cancelada","estado_notificacion": "pendiente"|"enviada"|"fallida","estado_pago": "pendiente"|"aprobado"|"rechazado"|"anulado","estado_reserva": "pendiente_pago"|"confirmada"|"en_curso"|"finalizada"|"cancelada"|"no_show","estado_reserva_servicio": "pendiente"|"confirmado"|"realizado"|"cancelado","estado_transporte": "programado"|"en_curso"|"completado"|"cancelado","medio_pago": "webpay"|"transferencia"|"efectivo","origen_reserva": "web"|"presencial","rol_usuario": "admin"|"funcionario"|"cliente","tipo_acta": "check_in"|"check_out","tipo_cargo": "dano"|"multa"|"consumo"|"otro","tipo_movimiento": "ingreso"|"egreso","tipo_movimiento_inventario": "alta"|"baja"|"deterioro"|"reparacion","tipo_notificacion": "confirmacion_reserva"|"comprobante_pago"|"coordinacion_transporte"|"recordatorio_checkout"|"alerta_mantencion"|"cancelacion_reserva","tipo_servicio": "tour"|"equipamiento"|"transporte"|"otro","tipo_transporte": "llegada"|"salida"|"tour"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "categoria_movimiento": ["arriendo", "servicio_extra", "cargo", "reembolso", "reparacion", "mantencion", "dividendo", "contribucion", "transporte", "otro"],"concepto_pago": ["anticipo", "saldo", "servicio_extra", "cargo", "reembolso"],"estado_departamento": ["disponible", "reservado", "ocupado", "en_mantencion", "inactivo"],"estado_item": ["bueno", "deteriorado", "en_reparacion", "baja"],"estado_mantencion": ["programada", "en_curso", "completada", "cancelada"],"estado_notificacion": ["pendiente", "enviada", "fallida"],"estado_pago": ["pendiente", "aprobado", "rechazado", "anulado"],"estado_reserva": ["pendiente_pago", "confirmada", "en_curso", "finalizada", "cancelada", "no_show"],"estado_reserva_servicio": ["pendiente", "confirmado", "realizado", "cancelado"],"estado_transporte": ["programado", "en_curso", "completado", "cancelado"],"medio_pago": ["webpay", "transferencia", "efectivo"],"origen_reserva": ["web", "presencial"],"rol_usuario": ["admin", "funcionario", "cliente"],"tipo_acta": ["check_in", "check_out"],"tipo_cargo": ["dano", "multa", "consumo", "otro"],"tipo_movimiento": ["ingreso", "egreso"],"tipo_movimiento_inventario": ["alta", "baja", "deterioro", "reparacion"],"tipo_notificacion": ["confirmacion_reserva", "comprobante_pago", "coordinacion_transporte", "recordatorio_checkout", "alerta_mantencion", "cancelacion_reserva"],"tipo_servicio": ["tour", "equipamiento", "transporte", "otro"],"tipo_transporte": ["llegada", "salida", "tour"]
          }
        }
} as const
