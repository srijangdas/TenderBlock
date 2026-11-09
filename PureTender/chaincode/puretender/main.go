package main

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type SmartContract struct {
	contractapi.Contract
}

type IntegrityRecord struct {
	RecordID   string `json:"recordId"`
	RecordType string `json:"recordType"`
	ParentID   string `json:"parentId"`
	PayloadHash string `json:"payloadHash"`
	CreatedAt  string `json:"createdAt"`
	UpdatedAt  string `json:"updatedAt"`
}

type Asset struct {
	ID             string `json:"ID"`
	Color          string `json:"Color"`
	Size           int    `json:"Size"`
	Owner          string `json:"Owner"`
	AppraisedValue int    `json:"AppraisedValue"`
}

// CreateAsset and GetAllAssets preserve the original sample controller API.
func (s *SmartContract) CreateAsset(
	ctx contractapi.TransactionContextInterface,
	id string,
	color string,
	size string,
	owner string,
	appraisedValue string,
) error {
	sizeValue, err := strconv.Atoi(size)
	if err != nil {
		return fmt.Errorf("invalid asset size: %w", err)
	}
	value, err := strconv.Atoi(appraisedValue)
	if err != nil {
		return fmt.Errorf("invalid appraised value: %w", err)
	}
	key := "ASSET:" + id
	exists, err := ctx.GetStub().GetState(key)
	if err != nil {
		return err
	}
	if exists != nil {
		return fmt.Errorf("asset %s already exists", id)
	}
	asset := Asset{ID: id, Color: color, Size: sizeValue, Owner: owner, AppraisedValue: value}
	data, err := json.Marshal(asset)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(key, data)
}

func (s *SmartContract) GetAllAssets(
	ctx contractapi.TransactionContextInterface,
) ([]Asset, error) {
	iterator, err := ctx.GetStub().GetStateByRange("ASSET:", "ASSET;")
	if err != nil {
		return nil, err
	}
	defer iterator.Close()

	assets := make([]Asset, 0)
	for iterator.HasNext() {
		entry, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		var asset Asset
		if err := json.Unmarshal(entry.Value, &asset); err != nil {
			return nil, err
		}
		assets = append(assets, asset)
	}
	return assets, nil
}

func (s *SmartContract) CreateRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
	recordType string,
	parentID string,
	payloadHash string,
) error {
	if err := validateRecord(id, recordType, payloadHash); err != nil {
		return err
	}

	exists, err := s.RecordExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("record %s already exists", id)
	}

	now, err := transactionTime(ctx)
	if err != nil {
		return err
	}
	record := IntegrityRecord{
		RecordID: id, RecordType: recordType, ParentID: parentID,
		PayloadHash: payloadHash, CreatedAt: now, UpdatedAt: now,
	}
	return putRecord(ctx, record)
}

func (s *SmartContract) UpdateRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
	payloadHash string,
) error {
	if err := validateRecord(id, "TENDER", payloadHash); err != nil {
		return err
	}

	record, err := s.ReadRecord(ctx, id)
	if err != nil {
		return err
	}
	now, err := transactionTime(ctx)
	if err != nil {
		return err
	}
	record.PayloadHash = payloadHash
	record.UpdatedAt = now
	return putRecord(ctx, *record)
}

func (s *SmartContract) ReadRecord(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*IntegrityRecord, error) {
	if id == "" {
		return nil, fmt.Errorf("record ID is required")
	}
	data, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read record %s: %w", id, err)
	}
	if data == nil {
		return nil, fmt.Errorf("record %s does not exist", id)
	}
	var record IntegrityRecord
	if err := json.Unmarshal(data, &record); err != nil {
		return nil, fmt.Errorf("record %s has invalid state: %w", id, err)
	}
	return &record, nil
}

func (s *SmartContract) RecordExists(
	ctx contractapi.TransactionContextInterface,
	id string,
) (bool, error) {
	data, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read record %s: %w", id, err)
	}
	return data != nil, nil
}

func (s *SmartContract) GetAllRecords(
	ctx contractapi.TransactionContextInterface,
) ([]IntegrityRecord, error) {
	iterator, err := ctx.GetStub().GetStateByRange("BID:", "TENDER;")
	if err != nil {
		return nil, err
	}
	defer iterator.Close()

	records := make([]IntegrityRecord, 0)
	for iterator.HasNext() {
		entry, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		if !strings.HasPrefix(entry.Key, "BID:") &&
			!strings.HasPrefix(entry.Key, "TENDER:") {
			continue
		}
		var record IntegrityRecord
		if err := json.Unmarshal(entry.Value, &record); err != nil {
			return nil, fmt.Errorf("state %s is not an integrity record: %w", entry.Key, err)
		}
		records = append(records, record)
	}
	return records, nil
}

func validateRecord(id string, recordType string, payloadHash string) error {
	if id == "" {
		return fmt.Errorf("record ID is required")
	}
	if recordType != "TENDER" && recordType != "BID" {
		return fmt.Errorf("unsupported record type %q", recordType)
	}
	decoded, err := hex.DecodeString(payloadHash)
	if err != nil || len(decoded) != 32 {
		return fmt.Errorf("payload hash must be a 32-byte SHA-256 value")
	}
	return nil
}

func transactionTime(ctx contractapi.TransactionContextInterface) (string, error) {
	timestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", fmt.Errorf("failed to read transaction timestamp: %w", err)
	}
	return time.Unix(timestamp.Seconds, int64(timestamp.Nanos)).UTC().Format(time.RFC3339Nano), nil
}

func putRecord(ctx contractapi.TransactionContextInterface, record IntegrityRecord) error {
	data, err := json.Marshal(record)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(record.RecordID, data)
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		panic(err)
	}
	if err := chaincode.Start(); err != nil {
		panic(err)
	}
}
