'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';

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
};

interface ProofQRCodeProps {
  passportData: PassportData | null;
  proofSettings: ProofSettings;
}

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

export default function ProofQRCode({ passportData, proofSettings }: ProofQRCodeProps) {
  const { address } = useAccount();
  const [proofQrValue, setProofQrValue] = useState('');
  const [showQR, setShowQR] = useState(false);

  // Generate the proof QR code value based on the selected settings
  useEffect(() => {
    if (passportData && address) {
      // Filter the passport data based on privacy settings
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
      
      // Generate QR code data
      const qrData = JSON.stringify({
        type: 'PASSPORT_PROOF',
        data: filteredData,
      });
      
      setProofQrValue(qrData);
    }
  }, [passportData, proofSettings, address]);

  if (!passportData || !address) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4">Share Passport Proof</h2>
      <p className="text-gray-600 mb-4">
        Generate a QR code to share your passport verification proof with others.
        Only the information you&apos;ve enabled in your privacy settings will be included.
      </p>
      
      {!showQR ? (
        <button
          onClick={() => setShowQR(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Proof QR Code
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-md border-2 border-gray-200">
              <QRCodeSVG value={proofQrValue} size={250} />
            </div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-800 mb-1">Included in this proof:</h3>
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
          
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setShowQR(false)}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hide QR Code
            </button>
            <button
              onClick={() => {
                // This would be implemented with a real sharing API
                alert('Sharing functionality would be implemented here');
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Share Proof
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 