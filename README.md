# 🚀 SQS Lambda Integration

Proyecto serverless construido con **AWS CDK (Cloud Development Kit)** que demuestra la integración entre **Amazon SQS (Simple Queue Service)** y **AWS Lambda** para procesamiento asíncrono de mensajes.

## 📋 Overview

Este repositorio contiene un proyecto el en cual se construye un sistema de procesamiento asíncrono de mensajes en AWS utilizando Infrastructure as Code (IaC) con CDK. El proyecto implementa el patrón arquitectónico **productor-consumidor** donde:

- **Amazon SQS**: Actúa como cola de mensajes durable y escalable
- **AWS Lambda**: Procesa los mensajes de forma asíncrona y automática

## 🏗️ Arquitectura & Tecnologías

### **Core Technologies**

- **AWS CDK v2.229.1** - Infrastructure as Code framework para definir recursos AWS
- **AWS Lambda** - Función serverless para procesamiento de mensajes SQS
- **Amazon SQS** - Cola de mensajes para comunicación asíncrona
- **CloudWatch** - Monitoreo, logs y métricas automáticas
- **Node.js 18.x** - Runtime para la función Lambda
- **TypeScript 5.9.3** - Lenguaje de desarrollo para CDK
- **JavaScript** - Lenguaje para la función Lambda

### **AWS Services**

- **Amazon SQS** - Cola de mensajes con entrega garantizada y visibilidad timeout de 300 segundos
- **AWS Lambda** - Procesamiento event-driven con polling automático de SQS
- **CloudWatch Logs** - Almacenamiento centralizado de logs de Lambda
- **CloudWatch Metrics** - Métricas de rendimiento de cola y función
- **IAM** - Roles y permisos automáticos para Lambda-SQS integration

### **Development Tools**

- **Jest** - Framework de testing para pruebas unitarias
- **ts-jest** - Preset de Jest para TypeScript
- **AWS CDK CLI** - Herramienta de línea de comandos para despliegue
- **CloudFormation** - Motor subyacente para el aprovisionamiento de recursos

## 📁 Estructura del Proyecto

```
sqs-integration/
├── bin/
│   └── sqs-integration.ts            # Punto de entrada de la aplicación CDK
├── lib/
│   └── sqs-integration-stack.ts      # Definición del stack CDK (infraestructura)
├── lambda/
│   └── lambda_handler.js             # Código de la función Lambda
├── test/
│   └── sqs-integration.test.ts       # Tests unitarios del stack
├── cdk.json                          # Configuración del CDK Toolkit
├── cdk.out/                          # Templates CloudFormation sintetizados
├── package.json                      # Dependencias npm
├── tsconfig.json                     # Configuración de TypeScript
├── jest.config.js                    # Configuración de Jest
└── README.md                         # Documentación del proyecto
```

## ✨ Componentes Clave

### **1️⃣ Punto de Entrada CDK** (`bin/sqs-integration.ts`)

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { SqsIntegrationStack } from '../lib/sqs-integration-stack';

const app = new cdk.App();
new SqsIntegrationStack(app, 'SqsIntegrationStack');
```

**Responsabilidades:**
- Inicializa la aplicación CDK
- Instancia el stack principal de integración SQS-Lambda
- Define el nombre lógico del stack para CloudFormation

---

### **2️⃣ Cola SQS** (`lib/sqs-integration-stack.ts`)

```typescript
const queue = new sqs.Queue(this, 'SqsIntegrationQueue', {
  visibilityTimeout: Duration.seconds(300)
});
```

**Características:**
- **Visibility Timeout**: 300 segundos (5 minutos)
- **Tipo**: Cola estándar (Standard Queue)
- **Retries**: Automáticos con Dead Letter Queue (DLQ) configurable
- **Durabilidad**: Mensajes persistentes en múltiples zonas de disponibilidad
- **Escalabilidad**: Throughput ilimitado

**Ventajas del Visibility Timeout de 300s:**
- ✅ Permite procesamientos largos sin duplicación de mensajes
- ✅ Previene que otros consumidores procesen el mismo mensaje
- ✅ Si Lambda falla, el mensaje vuelve a estar disponible automáticamente

**Casos de Uso:**
- 📨 Procesamiento de tareas en background
- 📊 Ingestión de datos con alta latencia
- 🔄 Desacoplamiento de microservicios
- 📧 Envío de emails o notificaciones asíncronas

---

### **3️⃣ Función Lambda** (`lib/sqs-integration-stack.ts`)

```typescript
const sqs_lambda = new lambda.Function(this, "SQSLambda", {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'lambda_handler.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda'))
});
```

**Configuración:**
- **Runtime**: Node.js 18.x
- **Handler**: `lambda_handler.handler`
- **Source**: Directorio `lambda/`
- **Memoria**: 128 MB (por defecto, ajustable según necesidad)
- **Timeout**: 3 segundos (por defecto, debe ser menor que visibility timeout)
- **Concurrent Executions**: Sin límite (escala automáticamente)

**Funcionamiento:**
```javascript
// lambda/lambda_handler.js
exports.handler = async (event) => {
  // event.Records contiene los mensajes de SQS
  for (const record of event.Records) {
    const messageBody = JSON.parse(record.body);
    console.log('Procesando mensaje:', messageBody);
    
    // Lógica de procesamiento aquí
    // Si la función retorna exitosamente, SQS elimina el mensaje
    // Si falla, el mensaje vuelve a la cola después del visibility timeout
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Mensajes procesados exitosamente' })
  };
};
```

---

### **4️⃣ Event Source Mapping - Integración SQS-Lambda**

```typescript
sqs_lambda.addEventSource(new lambdaEventSources.SqsEventSource(queue));
```

**Características:**
- **Polling Automático**: Lambda consulta la cola SQS automáticamente
- **Batch Size**: Por defecto, Lambda procesa hasta 10 mensajes por invocación
- **Parallel Processing**: Múltiples instancias de Lambda se ejecutan en paralelo
- **Automatic Scaling**: AWS ajusta el número de invocaciones según el tamaño de la cola
- **Error Handling**: Mensajes que fallan vuelven a la cola para reintento

**Permisos IAM Automáticos:**
CDK crea automáticamente los siguientes permisos:
- ✅ `sqs:ReceiveMessage` - Lambda puede leer mensajes
- ✅ `sqs:DeleteMessage` - Lambda puede eliminar mensajes procesados
- ✅ `sqs:GetQueueAttributes` - Lambda puede obtener metadatos de la cola
- ✅ `sqs:ChangeMessageVisibility` - Lambda puede extender el visibility timeout

---

## ☁️ Recursos AWS Creados

Al ejecutar `npx cdk deploy`, se crean los siguientes recursos en tu cuenta de AWS:

| Recurso | Tipo AWS | Propósito | Costo Estimado |
|---------|----------|-----------|----------------|
| **SQS Queue** | `AWS::SQS::Queue` | Cola de mensajes con visibility timeout de 300s | $0.40/millón de peticiones |
| **Lambda Function** | `AWS::Lambda::Function` | Procesador de mensajes SQS | Gratis (1M invocaciones/mes) |
| **Lambda Execution Role** | `AWS::IAM::Role` | Permisos para Lambda-SQS | Gratis |
| **Event Source Mapping** | `AWS::Lambda::EventSourceMapping` | Conexión entre SQS y Lambda | Gratis |
| **CloudWatch Log Group** | `AWS::Logs::LogGroup` | Logs de Lambda | $0.50/GB almacenado |

**💰 Costo Total Estimado**: **Gratis** dentro del Free Tier de AWS (hasta 1 millón de invocaciones Lambda y 1 millón de peticiones SQS por mes).

## 🔄 Flujo de Funcionamiento

### **Procesamiento de Mensajes SQS con Lambda**

```
┌──────────┐     Envía         ┌─────────┐     Polling      ┌────────┐    Procesa    ┌─────────┐
│          │    Mensaje        │         │    Automático    │        │    Mensaje    │         │
│ Producer │ ───────────────> │   SQS   │ ───────────────> │ Lambda │ ────────────> │ Success │
│          │                   │  Queue  │                  │        │               │         │
└──────────┘                   └─────────┘                  └────────┘               └─────────┘
                                    │                            │
                                    │                            │ Falla
                                    │     Mensaje vuelve         │
                                    │ <──────────────────────────┘
                                    │   (después de 300s)
                                    │
                                    ▼
                          Reintento automático
```

**Flujo Detallado:**

1. **Producer envía mensaje a SQS**
   - Mensaje se almacena en la cola de forma durable
   - Mensaje está disponible para ser procesado

2. **Lambda hace polling automático**
   - AWS gestiona el polling (no requiere código adicional)
   - Lambda lee hasta 10 mensajes por batch

3. **Mensaje entra en estado "invisible"**
   - Visibility timeout de 300s se activa
   - Otros consumidores no pueden ver el mensaje

4. **Lambda procesa el mensaje**
   - Si tiene éxito: SQS elimina el mensaje automáticamente
   - Si falla: Mensaje vuelve a estar visible después de 300s

5. **Reintentos automáticos**
   - Mensaje se reintenta hasta que se procese exitosamente
   - Opcional: Configurar Dead Letter Queue (DLQ) para mensajes que fallan múltiples veces

---

## 🚀 Comandos Útiles

### **Instalación**

```bash
# Instalar dependencias
npm install

# Instalar AWS CDK CLI globalmente (si no lo tienes)
npm install -g aws-cdk
```

### **Development**

```bash
# Compilar TypeScript a JavaScript
npm run build

# Watch mode - compilación automática al guardar cambios
npm run watch

# Sintetizar CloudFormation template (ver infraestructura generada)
npx cdk synth

# Ver diferencias con el stack desplegado actualmente en AWS
npx cdk diff

# Listar todos los stacks en la app
npx cdk list

# Ejecutar tests unitarios
npm run test
```

### **Deployment**

```bash
# Bootstrap de CDK (solo primera vez en una cuenta/región)
npx cdk bootstrap

# Desplegar stack a AWS
npx cdk deploy

# Desplegar sin confirmación (CI/CD)
npx cdk deploy --require-approval never

# Destruir todos los recursos creados
npx cdk destroy
```

### **Testing con AWS CLI**

```bash
# Obtener la URL de la cola SQS
aws sqs list-queues

# Enviar un mensaje de prueba a la cola
aws sqs send-message \
  --queue-url https://sqs.REGION.amazonaws.com/ACCOUNT_ID/SqsIntegrationQueue \
  --message-body '{"test": "mensaje de prueba"}'

# Enviar múltiples mensajes para probar escalabilidad
for i in {1..100}; do
  aws sqs send-message \
    --queue-url https://sqs.REGION.amazonaws.com/ACCOUNT_ID/SqsIntegrationQueue \
    --message-body "{\"message\": \"Test $i\", \"timestamp\": \"$(date -Iseconds)\"}"
done

# Ver logs de Lambda en tiempo real
aws logs tail /aws/lambda/SqsIntegrationStack-SQSLambda --follow

# Ver métricas de la cola SQS
aws cloudwatch get-metric-statistics \
  --namespace AWS/SQS \
  --metric-name NumberOfMessagesSent \
  --dimensions Name=QueueName,Value=SqsIntegrationQueue \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

## 💡 Ventajas del Proyecto

| Ventaja | Descripción |
|---------|-------------|
| **🚀 Serverless** | Sin servidores que administrar, pago solo por uso real |
| **📈 Escalabilidad Automática** | AWS escala automáticamente según el número de mensajes en cola |
| **🔄 Procesamiento Asíncrono** | Desacoplamiento entre productores y consumidores |
| **💪 Alta Disponibilidad** | SQS replica mensajes en múltiples zonas de disponibilidad |
| **🛡️ Tolerancia a Fallos** | Reintentos automáticos con Dead Letter Queue opcional |
| **📝 Infrastructure as Code** | Infraestructura versionable, reproducible y auditable |
| **🔍 Observabilidad** | Logs y métricas automáticos en CloudWatch |
| **💰 Bajo Costo** | Free Tier cubre la mayoría del uso de desarrollo |
| **⚡ Event-Driven** | Arquitectura reactiva que responde a eventos |

## 📚 Casos de Uso

Este patrón arquitectónico es ideal para:

| Caso de Uso | Descripción |
|-------------|-------------|
| 🔄 **Procesamiento de Trabajos en Background** | Tareas que no requieren respuesta inmediata (procesamiento de imágenes, videos, etc.) |
| 📧 **Envío de Emails/Notificaciones** | Desacoplar envío de notificaciones de la lógica principal |
| 📊 **Ingestión de Datos** | Procesamiento de grandes volúmenes de datos sin pérdida |
| 🌐 **Desacoplamiento de Microservicios** | Comunicación asíncrona entre servicios independientes |
| 🔔 **Event-Driven Architecture** | Respuesta a eventos del sistema de forma desacoplada |
| 📱 **Webhooks Processing** | Procesar callbacks de servicios externos de forma confiable |
| 🎯 **Rate Limiting** | Controlar la tasa de procesamiento de requests |
| 🔁 **Retry Logic** | Reintentos automáticos para operaciones que pueden fallar temporalmente |

## 🛠️ Próximos Pasos Sugeridos

### **Nivel Básico**
- [ ] Implementar lógica de procesamiento real en `lambda_handler.js`
- [ ] Agregar validación de mensajes (schema validation)
- [ ] Configurar variables de entorno para Lambda
- [ ] Implementar logs estructurados (JSON logging)

### **Nivel Intermedio**
- [ ] **Dead Letter Queue (DLQ)**: Configurar cola para mensajes que fallan después de múltiples reintentos
- [ ] **Batch Processing**: Ajustar `batchSize` para optimizar throughput
- [ ] **Partial Batch Failure**: Implementar `reportBatchItemFailures` para reintentar solo mensajes fallidos
- [ ] **Alarmas CloudWatch**: Alertas para mensajes en DLQ, errores de Lambda, etc.
- [ ] **X-Ray Tracing**: Implementar AWS X-Ray para trazabilidad de mensajes
- [ ] **Message Attributes**: Usar atributos de mensaje para filtrado y routing

### **Nivel Avanzado**
- [ ] **FIFO Queue**: Implementar cola FIFO para garantizar orden de procesamiento
- [ ] **SNS Fan-out**: Agregar SNS → múltiples colas SQS para procesamiento paralelo
- [ ] **DynamoDB Integration**: Persistir resultados de procesamiento en DynamoDB
- [ ] **Step Functions**: Orquestar workflows complejos multi-step
- [ ] **CI/CD Pipeline**: Automatizar despliegue con GitHub Actions o CodePipeline
- [ ] **Multi-stage Deployment**: Ambientes separados (dev, staging, prod)
- [ ] **Cost Optimization**: Implementar Reserved Concurrency y análisis de costos
- [ ] **Security**: Cifrado de mensajes SQS con KMS, VPC endpoints

## 📊 Configuración Avanzada de SQS

### **Configuración de Dead Letter Queue**

```typescript
// Crear DLQ
const dlQueue = new sqs.Queue(this, 'SqsIntegrationDLQ', {
  queueName: 'SqsIntegrationDLQ',
  retentionPeriod: Duration.days(14), // Retener mensajes fallidos 14 días
});

// Configurar cola principal con DLQ
const queue = new sqs.Queue(this, 'SqsIntegrationQueue', {
  visibilityTimeout: Duration.seconds(300),
  deadLetterQueue: {
    queue: dlQueue,
    maxReceiveCount: 3, // Después de 3 intentos, mover a DLQ
  },
});
```

### **Configuración de Batch Processing**

```typescript
sqs_lambda.addEventSource(new lambdaEventSources.SqsEventSource(queue, {
  batchSize: 10, // Número de mensajes por invocación
  maxBatchingWindow: Duration.seconds(5), // Esperar hasta 5s para llenar batch
  reportBatchItemFailures: true, // Solo reintentar mensajes fallidos
}));
```

### **Configuración de FIFO Queue**

```typescript
const fifoQueue = new sqs.Queue(this, 'SqsIntegrationFifoQueue', {
  fifo: true,
  contentBasedDeduplication: true, // Deduplicación automática
  visibilityTimeout: Duration.seconds(300),
});
```

## 📖 Recursos Adicionales

### **Documentación Oficial**
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon SQS Developer Guide](https://docs.aws.amazon.com/sqs/)
- [Lambda-SQS Integration Guide](https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html)

### **Tutoriales**
- [AWS CDK Workshop](https://cdkworkshop.com/)
- [Serverless Patterns Collection](https://serverlessland.com/patterns)
- [SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)

### **Best Practices**
- [CDK Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/best-practices.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [SQS Standard vs FIFO Queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues.html)

## 📄 Configuración del Proyecto

### **cdk.json**

El archivo `cdk.json` define cómo el CDK Toolkit ejecuta la aplicación TypeScript:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/sqs-integration.ts",
  "context": {
    // Feature flags para comportamientos específicos de CDK
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "@aws-cdk/core:newStyleStackSynthesis": true
  }
}
```

### **package.json**

```json
{
  "name": "sqs-integration",
  "version": "0.1.0",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.229.1",
    "constructs": "^10.4.3"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^24.10.1",
    "aws-cdk": "2.1033.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "~5.9.3"
  }
}
```

### **tsconfig.json**

Configuración de TypeScript para compilar CDK:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## 🔍 Monitoreo y Observabilidad

### **Métricas Clave de SQS**

| Métrica | Descripción | Acción Recomendada |
|---------|-------------|-------------------|
| `NumberOfMessagesSent` | Mensajes enviados a la cola | Verificar productores |
| `NumberOfMessagesReceived` | Mensajes consumidos por Lambda | Verificar throughput |
| `ApproximateNumberOfMessagesVisible` | Mensajes pendientes en cola | Escalar si es alto |
| `ApproximateAgeOfOldestMessage` | Edad del mensaje más antiguo | Alarma si > threshold |
| `NumberOfMessagesDeleted` | Mensajes procesados exitosamente | Monitorear tasa de éxito |

### **Métricas Clave de Lambda**

| Métrica | Descripción | Acción Recomendada |
|---------|-------------|-------------------|
| `Invocations` | Número de ejecuciones | Correlacionar con mensajes SQS |
| `Errors` | Invocaciones fallidas | Investigar logs |
| `Duration` | Tiempo de ejecución | Optimizar si es alto |
| `ConcurrentExecutions` | Ejecuciones simultáneas | Ajustar límites si necesario |
| `Throttles` | Invocaciones limitadas | Aumentar concurrency |

### **CloudWatch Logs Insights - Queries Útiles**

```sql
# Ver todos los errores de Lambda
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

# Analizar tiempos de procesamiento
fields @timestamp, @duration
| stats avg(@duration), max(@duration), min(@duration)
| sort @timestamp desc

# Contar mensajes procesados por hora
fields @timestamp
| stats count() by bin(1h)
```

## 🤝 Contribuciones

Este es un proyecto educativo. Si encuentras mejoras o tienes sugerencias:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de código abierto y está disponible para fines educativos.

---
