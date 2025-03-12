'use client';

import { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAccount } from 'wagmi';

type PassportData = {
  isHuman: boolean;
  name?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  passportNumber?: string;
  issuingState?: string;
  expiryDate?: string;
  above18?: boolean;
  fromEU?: boolean;
  notOnOFACList?: boolean;
  timestamp: string;
  verificationProof: string;
};

type ProofSettings = {
  showName: boolean;
  showNationality: boolean;
  showDateOfBirth: boolean;
  showGender: boolean;
  showPassportNumber: boolean;
  showIssuingState: boolean;
  showExpiryDate: boolean;
  showIsHuman: boolean;
  showIsAdult: boolean;
  showNotOnSanctionsList: boolean;
  initialized?: boolean;
};

type QRProofSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  passportData: PassportData | null;
  proofSettings: ProofSettings;
};

// Define a type for filtered passport data
type FilteredPassportData = {
  name?: string;
  nationality?: string;
  dateOfBirth?: string;
  gender?: string;
  passportNumber?: string;
  issuingState?: string;
  expiryDate?: string;
  isHuman?: boolean;
  isAdult?: boolean;
  notOnSanctionsList?: boolean;
  walletAddress: string;
  verificationProof: string;
  timestamp: string;
};

export default function QRProofSheet({ 
  isOpen, 
  onClose, 
  passportData, 
  proofSettings 
}: QRProofSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();

  // Generate QR code data based on passport data and proof settings
  const getFilteredPassportData = (): FilteredPassportData | null => {
    if (!passportData || !address) return null;
    
    const filteredData: Partial<FilteredPassportData> = {};
    
    // Only include fields that are enabled in privacy settings
    if (proofSettings.showName && passportData.name) filteredData.name = passportData.name;
    if (proofSettings.showNationality && passportData.nationality) filteredData.nationality = passportData.nationality;
    if (proofSettings.showDateOfBirth && passportData.dateOfBirth) filteredData.dateOfBirth = passportData.dateOfBirth;
    if (proofSettings.showGender && passportData.gender) filteredData.gender = passportData.gender;
    if (proofSettings.showPassportNumber && passportData.passportNumber) filteredData.passportNumber = passportData.passportNumber;
    if (proofSettings.showIssuingState && passportData.issuingState) filteredData.issuingState = passportData.issuingState;
    if (proofSettings.showExpiryDate && passportData.expiryDate) filteredData.expiryDate = passportData.expiryDate;
    
    // Include verification facts
    if (proofSettings.showIsHuman && passportData.isHuman) filteredData.isHuman = passportData.isHuman;
    if (proofSettings.showIsAdult && passportData.above18) filteredData.isAdult = passportData.above18;
    if (proofSettings.showNotOnSanctionsList && passportData.notOnOFACList) filteredData.notOnSanctionsList = passportData.notOnOFACList;
    
    // Add wallet address and verification proof
    filteredData.walletAddress = address;
    filteredData.verificationProof = passportData.verificationProof;
    filteredData.timestamp = new Date().toISOString();
    
    return filteredData as FilteredPassportData;
  };

  const qrData = JSON.stringify({
    type: 'PASSPORT_PROOF',
    data: getFilteredPassportData() || {},
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div 
        ref={sheetRef}
        className="bg-white rounded-xl w-full max-w-md mx-4 p-6"
      >
        <h2 className="text-2xl font-bold mb-4">Your Passport Proof</h2>
        <p className="text-gray-600 mb-6">
          Share this QR code to prove your identity with the information you&apos;ve selected to disclose.
        </p>
        
        <div className="flex justify-center py-4">
          <div className="bg-white p-4 rounded-md border-2 border-gray-200">
            <QRCodeSVG value={qrData} size={250} />
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-800 mb-1">Information included:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            {proofSettings.showIsHuman && <li>✓ Human verification</li>}
            {proofSettings.showIsAdult && <li>✓ Age verification (18+)</li>}
            {proofSettings.showNotOnSanctionsList && <li>✓ Sanctions list check</li>}
            {proofSettings.showNationality && <li>✓ Nationality</li>}
            {proofSettings.showName && <li>✓ Name</li>}
            {proofSettings.showDateOfBirth && <li>✓ Date of birth</li>}
            {proofSettings.showGender && <li>✓ Gender</li>}
            {proofSettings.showPassportNumber && <li>✓ Passport number</li>}
            {proofSettings.showIssuingState && <li>✓ Issuing country</li>}
            {proofSettings.showExpiryDate && <li>✓ Expiry date</li>}
          </ul>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Add share functionality if needed
              alert('Sharing functionality would be implemented here');
            }}
            className="flex-1 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-700"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
} 