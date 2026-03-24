-- CreateEnum
CREATE TYPE "TradingMode" AS ENUM ('PAPER', 'LIVE');

-- CreateEnum
CREATE TYPE "TradeAction" AS ENUM ('BUY', 'SELL', 'HOLD');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "mode" "TradingMode" NOT NULL DEFAULT 'PAPER',
    "tradeFrequencyHours" INTEGER NOT NULL DEFAULT 24,
    "buyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "sellThreshold" DOUBLE PRECISION NOT NULL DEFAULT -0.3,
    "maxPositionPct" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "minTradeUsd" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "signalWeights" JSONB NOT NULL,
    "enabledSignals" TEXT[],
    "lastEngineRun" TIMESTAMP(3),
    "lastEngineStatus" TEXT,
    "lastEngineMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rawValue" DOUBLE PRECISION NOT NULL,
    "normalizedValue" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predictionId" TEXT,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "compositeScore" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "action" "TradeAction" NOT NULL,
    "reasoning" TEXT NOT NULL,
    "signalSnapshot" JSONB NOT NULL,
    "priceAtPrediction" DOUBLE PRECISION NOT NULL,
    "priceAfter1h" DOUBLE PRECISION,
    "priceAfter4h" DOUBLE PRECISION,
    "priceAfter24h" DOUBLE PRECISION,
    "outcomeCorrect" BOOLEAN,
    "actualReturn" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "mode" "TradingMode" NOT NULL,
    "action" "TradeAction" NOT NULL,
    "symbol" TEXT NOT NULL DEFAULT 'ETH/USD',
    "status" "TradeStatus" NOT NULL,
    "orderId" TEXT,
    "requestedQty" DOUBLE PRECISION,
    "requestedNotional" DOUBLE PRECISION,
    "filledQty" DOUBLE PRECISION,
    "filledPrice" DOUBLE PRECISION,
    "filledNotional" DOUBLE PRECISION,
    "entryPrice" DOUBLE PRECISION,
    "exitPrice" DOUBLE PRECISION,
    "realizedPnl" DOUBLE PRECISION,
    "realizedPnlPct" DOUBLE PRECISION,
    "predictionId" TEXT,
    "alpacaResponse" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "mode" "TradingMode" NOT NULL,
    "equity" DOUBLE PRECISION NOT NULL,
    "cash" DOUBLE PRECISION NOT NULL,
    "positionValue" DOUBLE PRECISION NOT NULL,
    "positionQty" DOUBLE PRECISION NOT NULL,
    "ethPrice" DOUBLE PRECISION NOT NULL,
    "dayPnl" DOUBLE PRECISION NOT NULL,
    "totalPnl" DOUBLE PRECISION NOT NULL,
    "totalPnlPct" DOUBLE PRECISION NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalPerformance" (
    "id" TEXT NOT NULL,
    "signalName" TEXT NOT NULL,
    "periodDays" INTEGER NOT NULL,
    "totalPredictions" INTEGER NOT NULL,
    "correctPredictions" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "avgContribution" DOUBLE PRECISION NOT NULL,
    "correlationWithReturn" DOUBLE PRECISION NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signal_name_fetchedAt_idx" ON "Signal"("name", "fetchedAt");

-- CreateIndex
CREATE INDEX "Signal_predictionId_idx" ON "Signal"("predictionId");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- CreateIndex
CREATE INDEX "Prediction_action_idx" ON "Prediction"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_predictionId_key" ON "Trade"("predictionId");

-- CreateIndex
CREATE INDEX "Trade_mode_createdAt_idx" ON "Trade"("mode", "createdAt");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_mode_snapshotAt_idx" ON "PortfolioSnapshot"("mode", "snapshotAt");

-- CreateIndex
CREATE INDEX "SignalPerformance_signalName_idx" ON "SignalPerformance"("signalName");

-- CreateIndex
CREATE UNIQUE INDEX "SignalPerformance_signalName_periodDays_evaluatedAt_key" ON "SignalPerformance"("signalName", "periodDays", "evaluatedAt");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_predictionId_fkey" FOREIGN KEY ("predictionId") REFERENCES "Prediction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
