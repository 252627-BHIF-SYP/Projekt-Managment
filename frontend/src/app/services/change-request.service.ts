import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ChangeRequest, ChangeRequestStatus, ChangeRequestType } from '../core/models';
import { ApiService } from '../core/services/api.service';

/**
 * Change request service
 */
@Injectable({
  providedIn: 'root'
})
export class ChangeRequestService {
  // Mock data
  private mockChangeRequests: ChangeRequest[] = [
    {
      id: '1',
      projectId: '1',
      projectTitle: 'E-Commerce Platform',
      type: ChangeRequestType.ADD_STUDENT,
      requestedById: '4',
      requestedByName: 'Anna Weber',
      status: ChangeRequestStatus.PENDING,
      title: 'Add new team member',
      description: 'Request to add Paul Bauer to the project team',
      requestData: { studentId: '4', studentName: 'Paul Bauer' },
      createdAt: new Date('2024-10-15'),
      updatedAt: new Date('2024-10-15')
    },
    {
      id: '2',
      projectId: '1',
      projectTitle: 'E-Commerce Platform',
      type: ChangeRequestType.CHANGE_DEADLINE,
      requestedById: '5',
      requestedByName: 'Tom Fischer',
      status: ChangeRequestStatus.APPROVED,
      title: 'Extend project deadline',
      description: 'Request to extend deadline by 2 weeks due to technical issues',
      requestData: { newDeadline: '2025-07-15' },
      reviewedById: '3',
      reviewedByName: 'Max Müller',
      reviewedAt: new Date('2024-10-16'),
      reviewComment: 'Approved due to valid technical reasons',
      createdAt: new Date('2024-10-10'),
      updatedAt: new Date('2024-10-16')
    }
  ];

  constructor(private apiService: ApiService) {}

  /**
   * Get all change requests
   */
  getChangeRequests(): Observable<ChangeRequest[]> {
    // TODO: Replace with API call
    // return this.apiService.get<ChangeRequest[]>('/change-requests');
    return of(this.mockChangeRequests).pipe(delay(200));
  }

  /**
   * Get change requests by project
   */
  getChangeRequestsByProject(projectId: string): Observable<ChangeRequest[]> {
    // TODO: Replace with API call
    // return this.apiService.get<ChangeRequest[]>(`/change-requests?projectId=${projectId}`);
    return of(this.mockChangeRequests.filter(cr => cr.projectId === projectId)).pipe(delay(200));
  }

  /**
   * Get change request by ID
   */
  getChangeRequestById(id: string): Observable<ChangeRequest> {
    // TODO: Replace with API call
    // return this.apiService.get<ChangeRequest>(`/change-requests/${id}`);
    const request = this.mockChangeRequests.find(cr => cr.id === id);
    if (!request) {
      throw new Error('Change request not found');
    }
    return of(request).pipe(delay(200));
  }

  /**
   * Create change request
   */
  createChangeRequest(request: Partial<ChangeRequest>): Observable<ChangeRequest> {
    // TODO: Replace with API call
    // return this.apiService.post<ChangeRequest>('/change-requests', request);
    const newRequest: ChangeRequest = {
      id: String(this.mockChangeRequests.length + 1),
      projectId: request.projectId || '',
      type: request.type || ChangeRequestType.OTHER,
      requestedById: '4', // Current user
      status: ChangeRequestStatus.PENDING,
      title: request.title || '',
      description: request.description || '',
      requestData: request.requestData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return of(newRequest).pipe(delay(300));
  }

  /**
   * Approve change request
   */
  approveChangeRequest(id: string, comment?: string): Observable<ChangeRequest> {
    // TODO: Replace with API call
    // return this.apiService.patch<ChangeRequest>(`/change-requests/${id}/approve`, { comment });
    const request = this.mockChangeRequests.find(cr => cr.id === id);
    if (!request) {
      throw new Error('Change request not found');
    }
    const updated: ChangeRequest = {
      ...request,
      status: ChangeRequestStatus.APPROVED,
      reviewedById: '3',
      reviewedByName: 'Max Müller',
      reviewedAt: new Date(),
      reviewComment: comment,
      updatedAt: new Date()
    };
    return of(updated).pipe(delay(300));
  }

  /**
   * Reject change request
   */
  rejectChangeRequest(id: string, comment?: string): Observable<ChangeRequest> {
    // TODO: Replace with API call
    // return this.apiService.patch<ChangeRequest>(`/change-requests/${id}/reject`, { comment });
    const request = this.mockChangeRequests.find(cr => cr.id === id);
    if (!request) {
      throw new Error('Change request not found');
    }
    const updated: ChangeRequest = {
      ...request,
      status: ChangeRequestStatus.REJECTED,
      reviewedById: '3',
      reviewedByName: 'Max Müller',
      reviewedAt: new Date(),
      reviewComment: comment,
      updatedAt: new Date()
    };
    return of(updated).pipe(delay(300));
  }
}
