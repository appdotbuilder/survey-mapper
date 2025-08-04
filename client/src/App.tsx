
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { SurveyPoint, CreateSurveyPointInput } from '../../server/src/schema';

function App() {
  const [surveyPoints, setSurveyPoints] = useState<SurveyPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // NYC default
  const [mapZoom, setMapZoom] = useState(13);

  const [formData, setFormData] = useState<CreateSurveyPointInput>({
    latitude: 0,
    longitude: 0,
    location_name: '',
    description: null,
    survey_date: new Date()
  });

  const loadSurveyPoints = useCallback(async () => {
    try {
      const result = await trpc.getSurveyPoints.query({
        search: searchTerm || undefined,
        limit: 100,
        offset: 0
      });
      setSurveyPoints(result);
    } catch (error) {
      console.error('Failed to load survey points:', error);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadSurveyPoints();
  }, [loadSurveyPoints]);

  // Convert pixel coordinates to lat/lng (simplified calculation)
  const pixelToLatLng = (x: number, y: number, containerWidth: number, containerHeight: number) => {
    // This is a simplified conversion - in a real app you'd use proper map projection
    const latRange = 0.1; // Degrees visible in viewport
    const lngRange = 0.15; // Degrees visible in viewport
    
    const lat = mapCenter.lat + (0.5 - y / containerHeight) * latRange;
    const lng = mapCenter.lng + (x / containerWidth - 0.5) * lngRange;
    
    return { lat, lng };
  };

  // Convert lat/lng to pixel coordinates
  const latLngToPixel = (lat: number, lng: number, containerWidth: number, containerHeight: number) => {
    const latRange = 0.1;
    const lngRange = 0.15;
    
    const x = ((lng - mapCenter.lng) / lngRange + 0.5) * containerWidth;
    const y = (0.5 - (lat - mapCenter.lat) / latRange) * containerHeight;
    
    return { x, y };
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const coords = pixelToLatLng(x, y, rect.width, rect.height);
    
    setSelectedCoordinates(coords);
    setFormData((prev: CreateSurveyPointInput) => ({
      ...prev,
      latitude: coords.lat,
      longitude: coords.lng
    }));
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createSurveyPoint.mutate(formData);
      setSurveyPoints((prev: SurveyPoint[]) => [...prev, response]);
      
      // Reset form and hide it
      setFormData({
        latitude: 0,
        longitude: 0,
        location_name: '',
        description: null,
        survey_date: new Date()
      });
      setSelectedCoordinates(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create survey point:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setSelectedCoordinates(null);
    setFormData({
      latitude: 0,
      longitude: 0,
      location_name: '',
      description: null,
      survey_date: new Date()
    });
  };

  const filteredPoints = surveyPoints.filter((point: SurveyPoint) =>
    point.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (point.description && point.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto p-4">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🗺️ Survey Mapping Tool</h1>
          <p className="text-gray-600">Click on the map to mark survey points and record location data</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📍 Interactive Map
                </CardTitle>
                <CardDescription>
                  Click anywhere on the map to create a new survey point
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Map Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapZoom(Math.min(mapZoom + 1, 18))}
                    >
                      🔍+ Zoom In
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapZoom(Math.max(mapZoom - 1, 1))}
                    >
                      🔍- Zoom Out
                    </Button>
                    <div className="text-sm text-gray-600">
                      Center: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)} | Zoom: {mapZoom}
                    </div>
                  </div>

                  {/* Simplified Map Display */}
                  <div 
                    className="h-96 w-full rounded-lg overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-green-100 to-blue-100 relative cursor-crosshair"
                    onClick={handleMapClick}
                    style={{
                      backgroundImage: `
                        radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)
                      `
                    }}
                  >
                    {/* Grid lines for reference */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(10)].map((_, i) => (
                        <div key={`h-${i}`} className="absolute w-full border-t border-gray-400" style={{ top: `${i * 10}%` }} />
                      ))}
                      {[...Array(10)].map((_, i) => (
                        <div key={`v-${i}`} className="absolute h-full border-l border-gray-400" style={{ left: `${i * 10}%` }} />
                      ))}
                    </div>

                    {/* Selected coordinates marker */}
                    {selectedCoordinates && (
                      <div
                        className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full shadow-lg transform -translate-x-2 -translate-y-2 animate-pulse"
                        style={{
                          ...latLngToPixel(selectedCoordinates.lat, selectedCoordinates.lng, 100, 100),
                          left: `${latLngToPixel(selectedCoordinates.lat, selectedCoordinates.lng, 100, 100).x}%`,
                          top: `${latLngToPixel(selectedCoordinates.lat, selectedCoordinates.lng, 100, 100).y}%`
                        }}
                      />
                    )}

                    {/* Existing survey points */}
                    {filteredPoints.map((point: SurveyPoint) => {
                      const pixelPos = latLngToPixel(point.latitude, point.longitude, 100, 100);
                      return (
                        <div
                          key={point.id}
                          className="absolute w-3 h-3 bg-blue-600 border border-white rounded-full shadow-md transform -translate-x-1.5 -translate-y-1.5 hover:scale-150 transition-transform cursor-pointer"
                          style={{
                            left: `${pixelPos.x}%`,
                            top: `${pixelPos.y}%`
                          }}
                          title={`${point.location_name} - ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`}
                        />
                      );
                    })}

                    {/* Click instruction overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                        🖱️ Click anywhere to add a survey point
                      </div>
                    </div>
                  </div>

                  {/* Map Navigation */}
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapCenter((prev) => ({ ...prev, lat: prev.lat + 0.01 }))}
                    >
                      ⬆️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapCenter((prev) => ({ ...prev, lng: prev.lng - 0.01 }))}
                    >
                      ⬅️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapCenter({ lat: 40.7128, lng: -74.0060 })}
                    >
                      🏠 NYC
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapCenter((prev) => ({ ...prev, lng: prev.lng + 0.01 }))}
                    >
                      ➡️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMapCenter((prev) => ({ ...prev, lat: prev.lat - 0.01 }))}
                    >
                      ⬇️
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form and List Section */}
          <div className="space-y-6">
            {/* New Survey Point Form */}
            {showForm && (
              <Card className="shadow-lg border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    ➕ New Survey Point
                  </CardTitle>
                  <CardDescription>
                    Record details for the selected location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      <strong>📍 Coordinates:</strong><br />
                      Latitude: {formData.latitude.toFixed(6)}<br />
                      Longitude: {formData.longitude.toFixed(6)}
                    </div>
                    
                    <div>
                      <Input
                        placeholder="Location name (e.g., Building A Corner, Property Boundary)"
                        value={formData.location_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSurveyPointInput) => ({ ...prev, location_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    
                    <div>
                      <Textarea
                        placeholder="Description (optional)"
                        value={formData.description || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateSurveyPointInput) => ({
                            ...prev,
                            description: e.target.value || null
                          }))
                        }
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Input
                        type="datetime-local"
                        value={formData.survey_date.toISOString().slice(0, 16)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateSurveyPointInput) => ({
                            ...prev,
                            survey_date: new Date(e.target.value)
                          }))
                        }
                        required
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading} className="flex-1">
                        {isLoading ? '⏳ Saving...' : '💾 Save Point'}
                      </Button>
                      <Button type="button" variant="outline" onClick={cancelForm}>
                        ❌ Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Search and Filter */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 Search Survey Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search by location name or description..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Survey Points List */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Survey Points
                  <Badge variant="secondary">{filteredPoints.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredPoints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {surveyPoints.length === 0 ? (
                      <>
                        <div className="text-4xl mb-2">🗺️</div>
                        <p>No survey points yet.</p>
                        <p className="text-sm">Click on the map to get started!</p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">🔍</div>
                        <p>No points match your search.</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredPoints.map((point: SurveyPoint) => (
                      <div key={point.id} className="border rounded-lg p-3 bg-white shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-1">
                              📍 {point.location_name}
                            </h3>
                            {point.description && (
                              <p className="text-sm text-gray-600 mt-1">{point.description}</p>
                            )}
                            <div className="text-xs text-gray-500 mt-2 space-y-1">
                              <div>📅 {point.survey_date.toLocaleDateString()}</div>
                              <div>📊 {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</div>
                              <div>🕒 Created: {point.created_at.toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
